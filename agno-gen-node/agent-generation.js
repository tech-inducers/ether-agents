module.exports = function(RED) {
    const fs = require('fs');
    const path = require('path');
    const AdmZip = require('adm-zip');

    function AgentGenerationNode(n) {
        RED.nodes.createNode(this, n);
        this.savePath = n.savePath;
        this.zipName = n.zipName;
        var node = this;

        node.on('input', function(msg) {
            let context = node.context();
            let payload = msg.payload;

            // Content-Based Detection (Auto-sorting)
            if (payload && payload.ollama_model) {
                context.set('cfg', payload);
                node.status({fill:"blue", shape:"dot", text:"Config cached"});
            } 
            else if (payload && (payload.items || payload.instructions)) {
                context.set('inst', payload);
                node.status({fill:"blue", shape:"dot", text:"Instructions cached"});
            }

            let cfg = context.get('cfg');
            let inst = context.get('inst');

            if (cfg && inst) {
                try {
                    const targetDir = path.resolve(node.savePath);
                    if (!fs.existsSync(targetDir)) {
                        fs.mkdirSync(targetDir, { recursive: true });
                    }

                    // Tool logic
                    const toolLib = {
                        "CsvTools": { "import": "from agno.tools.csv_toolkit import CsvTools", "init": "CsvTools(csvs=[base_dir / 'alarm_data.csv', base_dir / 'performance_data.csv'], enable_query_csv_file=False)" },
                        "FileTools": { "import": "from agno.tools.file import FileTools", "init": "FileTools(base_dir=base_dir)" },
                        "ShellTools": { "import": "from agno.tools.shell import ShellTools", "init": "ShellTools(base_dir=base_dir)" },
                        "DuckDuckGoTools": { "import": "from agno.tools.duckduckgo import DuckDuckGoTools", "init": "DuckDuckGoTools()" },
                        "PythonTools": { "import": "from agno.tools.python import PythonTools", "init": "PythonTools(base_dir=base_dir)" }
                    };

                    let activeImports = [];
                    let activeInits = [];
                    (cfg.tools || []).forEach(t => {
                        let name = t["tool name"] || t["tool_name"];
                        if (toolLib[name]) {
                            activeImports.push(toolLib[name].import);
                            activeInits.push(toolLib[name].init);
                        }
                    });

                    const agentPy = `import json, sqlite3, os
from pathlib import Path
from agno.agent import Agent
import agno.models.ollama as ollama_mod
${activeImports.join('\n')}

def run():
    base_dir = Path(__file__).parent
    with open(base_dir / "config.json", "r") as f: cfg = json.load(f)
    with open(base_dir / "user_instruction.json", "r") as f: inst = json.load(f)
    limit = cfg.get("manual_context_override")
    MClass = getattr(ollama_mod, "Ollama")
    agent = Agent(model=MClass(id=cfg.get("ollama_model"), options={"num_ctx": limit}), tools=[${activeInits.join(', ')}], markdown=True, stream=True)
    
    payload_str = json.dumps(inst)
    if len(payload_str) > (limit * 3.5):
        db = base_dir / "buffer.db"
        conn = sqlite3.connect(db)
        conn.execute("CREATE TABLE IF NOT EXISTS q (d TEXT)")
        for i in inst.get('items', []): conn.execute("INSERT INTO q VALUES (?)", (json.dumps(i),))
        conn.commit()
        for r in conn.execute("SELECT d FROM q"):
            p = "\\n".join([m['content'] for m in json.loads(r[0])['messages']])
            agent.print_response(p)
        conn.close()
        if os.path.exists(db): os.remove(db)
    else:
        for i in inst.get('items', []): agent.print_response("\\n".join([m['content'] for m in i['messages']]))

if __name__ == "__main__": run()`;

                    // Generate ZIP
                    const zip = new AdmZip();
                    zip.addFile("config.json", Buffer.from(JSON.stringify(cfg, null, 4), "utf8"));
                    zip.addFile("user_instruction.json", Buffer.from(JSON.stringify(inst, null, 4), "utf8"));
                    zip.addFile("agno_agent.py", Buffer.from(agentPy, "utf8"));

                    const finalZipPath = path.join(targetDir, `${node.zipName}.zip`);
                    zip.writeZip(finalZipPath);
                    
                    node.status({fill:"green", shape:"dot", text:"Saved " + node.zipName + ".zip"});
                    
                    // Cleanup context for next sequence
                    context.set('cfg', null);
                    context.set('inst', null);

                    node.send({payload: "Success", location: finalZipPath});

                } catch (err) {
                    node.error("Fatal Generation Error: " + err.message);
                    node.status({fill:"red", shape:"circle", text: err.message});
                }
            }
        });
    }
    RED.nodes.registerType("agent-generation", AgentGenerationNode);
}
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

            if (payload && (payload.model || payload.ollama_model)) {
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
                    if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

                    // Define Tool Library with correct imports and init signatures
                    const csvToolCfg = (cfg.tools || []).find(t => t["tool name"] === "CsvTools") || {};
                    const csvList = csvToolCfg.csvs ? JSON.stringify(csvToolCfg.csvs) : "['alarm_data.csv']";

                    const toolLib = {
                        "CsvTools": { 
                            "import": "from agno.tools.csv_toolkit import CsvTools", 
                            "init": `CsvTools(csvs=[base_dir / f for f in ${csvList}], enable_query_csv_file=False)` 
                        },
                        "FileTools": { "import": "from agno.tools.file import FileTools", "init": "FileTools(base_dir=base_dir)" },
                        "ShellTools": { "import": "from agno.tools.shell import ShellTools", "init": "ShellTools()" },
                        "DuckDuckGoTools": { "import": "from agno.tools.duckduckgo import DuckDuckGoTools", "init": "DuckDuckGoTools()" },
                        "PythonTools": { "import": "from agno.tools.python import PythonTools", "init": "PythonTools(base_dir=base_dir)" }
                    };

                    let activeImports = [];
                    let activeInits = [];
                    (cfg.tools || []).forEach(t => {
                        let name = t["tool name"];
                        if (toolLib[name]) {
                            activeImports.push(toolLib[name].import);
                            activeInits.push(toolLib[name].init);
                        }
                    });

                    const agentPy = `import json, sqlite3, os, importlib, requests, re
from pathlib import Path
from agno.agent import Agent
from dotenv import load_dotenv

# Dynamically Generated Imports
${activeImports.join('\n')}

load_dotenv()
base_dir = Path(__file__).parent

def get_ollama_ctx(m):
    if not m: return None
    try:
        r = requests.post("http://localhost:11434/api/show", json={"name": m, "verbose": True}, timeout=2)
        params = r.json().get("parameters", "")
        match = re.search(r'num_ctx\\\\s+(\\\\d+)', params)
        return int(match.group(1)) if match else None
    except:
        return None

def run():
    with open(base_dir / "config.json", "r") as f: cfg = json.load(f)
    with open(base_dir / "user_instruction.json", "r") as f: inst = json.load(f)
    
    model_id = cfg.get("model") or cfg.get("ollama_model")
    engine = cfg.get("inference engine", "ollama").lower()
    
    fetched_ctx = None
    if engine == "ollama":
        fetched_ctx = get_ollama_ctx(model_id)
    
    limit = cfg.get("manual_context_override") or fetched_ctx or 4096

    print(f"\\n{'='*40}")
    print(f"ETHER AGENT STARTING")
    print(f"MODEL: {model_id} | ENGINE: {engine}")
    if engine == "ollama":
        print(f"OLLAMA DETECTED CONTEXT: {fetched_ctx}")
    print(f"ACTIVE LIMIT: {limit} | TEMP: 0")
    print(f"{'='*40}\\n")

    if "openai" in engine:
        mod_path, cls_name = "agno.models.openai", "OpenAIChat"
    elif "google" in engine or "gemi" in engine:
        mod_path, cls_name = "agno.models.google", "Gemini"
    else:
        mod_path, cls_name = "agno.models.ollama", "Ollama"
            
    m_mod = importlib.import_module(mod_path)
    ModelClass = getattr(m_mod, cls_name)

    m_args = {"id": model_id}
    if engine == "ollama":
        m_args["options"] = {"num_ctx": limit, "temperature": 0}
    else:
        # Standard cloud providers use direct temperature param
        m_args["temperature"] = 0

    agent = Agent(
        model=ModelClass(**m_args), 
        tools=[${activeInits.join(', ')}], 
        markdown=cfg.get("markdown", True)
    )
    
    payload_str = json.dumps(inst)
    if len(payload_str) > (limit * 3.5):
        print("Large payload detected. Using SQL context buffer...")
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
        for i in inst.get('items', []): 
            agent.print_response("\\n".join([m['content'] for m in i['messages']]))

if __name__ == "__main__":
    run()`;

                    
                    const envContent = "OPENAI_API_KEY=your_key_here\\nGOOGLE_API_KEY=your_key_here";

                    const zip = new AdmZip();
                    zip.addFile("config.json", Buffer.from(JSON.stringify(cfg, null, 4), "utf8"));
                    zip.addFile("user_instruction.json", Buffer.from(JSON.stringify(inst, null, 4), "utf8"));
                    zip.addFile("ether_agent.py", Buffer.from(agentPy, "utf8"));
                    zip.addFile(".env", Buffer.from(envContent, "utf8"));

                    const zipPath = path.join(targetDir, node.zipName + ".zip");
                    zip.writeZip(zipPath);
                    
                    node.status({fill:"green", shape:"dot", text:"ZIP Generated: " + node.zipName});
                    node.send({payload: "Success", zip: zipPath});

                    context.set('cfg', null);
                    context.set('inst', null);

                } catch (err) {
                    node.error("Generation Error: " + err.message);
                }
            }
        });
    }
    RED.nodes.registerType("agent-generation", AgentGenerationNode);
}
module.exports = function(RED) {
    function MyCustomNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        var mode = config.mode || "json";
        var userJson = {};
        var userText = config.textContent || "";

        if (mode === "json") {
            try {
                userJson = JSON.parse(config.jsonContent || "{}");
            } catch(e) {
                node.warn("Invalid JSON: " + e.message);
                node.status({fill:"red", shape:"dot", text:"Invalid JSON"});
            }
        }

        node.on("input", function(msg) {
            if (mode === "json") {
                msg.payload = userJson;
                msg.contentType = "application/json";
            } else {
                msg.payload = userText;
                msg.contentType = "text/plain";
            }
            node.status({fill:"green", shape:"dot", text: mode + " sent"});
            node.send(msg);
        });
    }
    RED.nodes.registerType("my-custom-node", MyCustomNode);
};

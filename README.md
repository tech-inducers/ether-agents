# Ether-agents : No Code Agent generation platform

## Features
* Can generate agents with user provided LLM configuration  user instruction for model to 
perform.
* user can now provide tools information also within configuration.
* Zip file including user provided configuration.json, user-instruction.json and generated agent.py will be generated specified location provided.
* Integration method needs to be defined and integrated with generated code for Node-Red to receive and monitor real time time feed.
* Can be designed and used for distribution and local environment.

## Prerequisite
install nodered
https://github.com/node-red/node-red
node red custom node deployment
https://nodered.org/docs/creating-nodes/first-node
## use in NodeRed
* after successful deployment- Following custom nodes will be included in Node-Red  function palette.

----------------------------------------------------------------------------

![](https://raw.githubusercontent.com/tech-inducers/ether/main/images/custom_nodes.png)
![](https://raw.githubusercontent.com/tech-inducers/ether/main/images/use_of_agents.png)

-----------------------------------------------------------------------------





* sample configuration file can be found config-file-function-node

**** currently we are supporting Agno only, we are working available open source framework to be included in feture release


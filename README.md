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

install Ollama or use any public LLM with .env files for api key.
https://ollama.com/ 


## use in NodeRed
* after successful deployment- Following custom nodes will be included in Node-Red  function palette.

----------------------------------------------------------------------------

![](https://raw.githubusercontent.com/tech-inducers/ether/main/images/custom_nodes.png)
![](https://raw.githubusercontent.com/tech-inducers/ether/main/images/local_exec.png)

local_exec
-----------------------------------------------------------------------------
## Generate Agent in  NodeRed
* Use function nodes to provides llm configuration and agent instruction to agent-generation node as shown in picture. It generates zip file the path provided- containing agent code in python, config.json, user_instruction.json

## Validate ether Agent environment in  NodeRed
unzip bundle , copy setup.ps1/setup.sh from scripts folder and can copy requirments.txt 
run and validate setup- setup complete message and log shall be generated in the folder

## Run ether Agent environment in NodeRed
After successfully configuration and validation - agent is ready to run in local environment and can also be monitored using ether dashboard - to run sample configuration provided in config-file-function-node, you may require to copy test.csv in your unzip location to work.


* sample configuration file can be found config-file-function-node

Download Flow.json including generate, validate and run configuration - import configuration in NodeRed
https://github.com/tech-inducers/ether/tree/main/idea/marketplace/local_env

**** currently we are supporting Agno, we are working on available open source framework to be included in future release.

# ollama-gemma4-12b-pwa
ollama installed then this pwa installed then setx so they can chat. local 12B LLM in the browser. Warning a ~7 GB download. This model is not fast unless your computer is amazing, but it is very capable and has a 256 K token window.


<img width="226" height="179" alt="image" src="https://github.com/user-attachments/assets/65805b13-90d5-48c7-a8c8-4a14931c127e" />


Installable PWA at https://webmcu-ai.github.io/ollama-gemma4-12b-pwa/index.html


After ollama is installed you need to open a command window and on windows type

```
setx OLLAMA_ORIGINS "https://webmcu-ai.github.io"
```

AND THEN REBOOT THE COMPUTER and then wait for Ollama to show in the system tray, then load the installed PWA.

On Linux or MacOS the command should be

```
export OLLAMA_ORIGINS="https://webmcu-ai.github.io"

```

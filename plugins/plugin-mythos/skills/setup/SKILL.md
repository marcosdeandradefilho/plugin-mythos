---
name: setup
description: Onboarding for the Mythos plugin. Checks that the Mythos tools respond and shows the user what they can ask for. Use right after installation or when the user asks how to start with Mythos.
---

# Mythos setup

1. Call `mythos_design_brief` with `kind: "slides"` and `topic: "teste de instalação"`. If it answers, the connection works.
2. If the call fails or the tool is missing, tell the user that the Mythos MCP server is not connected and give these steps, in the user's language:
   - Open chatgpt.com/plugins, select +, then **Add custom MCP server**.
   - URL: `https://plugin-mythos.vercel.app/mcp`, authentication: none.
   - Accept the risk notice and select **Create as a plugin**, then start a new chat.
3. When it works, ask what the user wants to create and offer three starters:
   - "Uma apresentação de 10 slides sobre [tema] para [público]"
   - "Uma landing page para [produto ou curso]"
   - "Um quiz interativo de 8 perguntas sobre [assunto]"
4. Mention in one line that every result comes with a link that opens fullscreen, downloads HTML and prints to PDF.

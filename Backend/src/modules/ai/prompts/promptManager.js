import { summaryPromptTemplate } from "./summary.prompt.js";
import { examPromptTemplate } from "./exam.prompt.js";
import { gradingPromptTemplate } from "./grading.prompt.js";
import { chatPromptTemplate } from "./chat.prompt.js";
import { questionGenerationPromptTemplate } from "./questionGeneration.prompt.js";
import { AIError, AIErrorCode } from "../aiError.js";

class PromptManager {
  constructor() {
    this.templates = new Map();
    this.registerTemplate(summaryPromptTemplate);
    this.registerTemplate(examPromptTemplate);
    this.registerTemplate(gradingPromptTemplate);
    this.registerTemplate(chatPromptTemplate);
    this.registerTemplate(questionGenerationPromptTemplate);
  }

  registerTemplate(template) {
    if (!template || !template.name) {
      throw new Error("Invalid prompt template registration: missing name");
    }
    this.templates.set(template.name, template);
  }

  getTemplate(name) {
    const template = this.templates.get(name);
    if (!template) {
      throw new AIError(
        `Không tìm thấy Prompt Template tên là '${name}'`,
        AIErrorCode.AI_INVALID_INPUT,
        400
      );
    }
    return template;
  }

  build(templateName, params = {}) {
    const template = this.getTemplate(templateName);
    const userPrompt = template.buildPrompt(params);
    return {
      name: template.name,
      systemInstruction: template.systemInstruction,
      prompt: userPrompt,
    };
  }
}

export default new PromptManager();

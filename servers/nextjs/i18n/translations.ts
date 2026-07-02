export const SUPPORTED_LOCALES = ["en", "zh-CN"] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "zh-CN";
export const I18N_STORAGE_KEY = "presenton-ui-locale";

export const localeLabels: Record<Locale, string> = {
  en: "English",
  "zh-CN": "简体中文",
};

export const uiTranslations: Record<Locale, Record<string, string>> = {
  en: {},
  "zh-CN": {
    "AI Assistant": "AI 助手",
    "AI Edit": "AI 编辑",
    "API key": "API 密钥",
    "API Key (optional)": "API 密钥（可选）",
    "Actions": "操作",
    "Account created": "账号已创建",
    "Add Slide": "添加幻灯片",
    "Add First Slide": "添加第一页",
    "Add current web context to presentations, or continue with web search disabled.":
      "将当前网页上下文加入演示文稿，或在关闭联网搜索的情况下继续。",
    "Add a short summary of what this template is best for...":
      "简单描述这个模板最适合什么场景...",
    "Add new slide below": "在下方添加新幻灯片",
    "Add speaker notes to this slide": "为此页添加演讲备注",
    "Advanced": "高级",
    "Advanced Settings": "高级设置",
    "Advanced settings": "高级设置",
    "Adjust Presentation Behavior": "调整演示文稿行为",
    "All fonts are ready! You can proceed to preview.":
      "字体都已准备好，可以继续预览。",
    "All fonts are ready": "字体都已准备好",
    "All slides processed": "所有幻灯片已处理",
    "Auto (English)": "自动（英文）",
    "Apply AI edits & tweaks": "应用 AI 编辑和微调",
    "Apply": "应用",
    "Applying...": "正在应用...",
    "At least 6 characters": "至少 6 个字符",
    "Attached files": "已附加文件",
    "Attachments (optional)": "附件（可选）",
    "Attach files": "添加文件",
    "Available Fonts": "可用字体",
    "Auto slides": "自动页数",
    "BACK": "返回",
    "Back": "返回",
    "Back to Templates": "返回模板",
    "Build Template": "创建模板",
    "Build Theme": "创建主题",
    "Build Your Own Template": "创建你自己的模板",
    "Built-in": "内置",
    "Bring current information into generated presentations":
      "将当前信息带入生成的演示文稿",
    "Cancel": "取消",
    "Cannot delete slide": "无法删除幻灯片",
    "Cannot save settings": "无法保存设置",
    "Casual": "轻松",
    "Check Fonts": "检查字体",
    "Check models": "检查模型",
    "Check for available models": "检查可用模型",
    "Checking Fonts...": "正在检查字体...",
    "Checking for models...": "正在检查模型...",
    "ChatGPT model": "ChatGPT 模型",
    "Celebrate again!": "再庆祝一次！",
    "Choose Slide Layout": "选择幻灯片布局",
    "Choose a layout group before generating your presentation.":
      "生成演示文稿前请先选择布局组。",
    "Choose your preferences.": "选择你的偏好。",
    "Choose your image provider": "选择生图提供商",
    "Choose your text provider": "选择文本生成提供商",
    "Choose how Presenton creates visuals, or continue without image generation.":
      "选择 Presenton 如何生成图片，或继续关闭生图。",
    "Choosing where images come from": "选择图片来源",
    "Choosing where text content comes from": "选择文本内容来源",
    "Checking status": "正在检查状态",
    "Click to Upload": "点击上传",
    "Close": "关闭",
    "Close advanced settings": "关闭高级设置",
    "Close layout picker": "关闭布局选择器",
    "Code": "代码",
    "Community": "社区",
    "ComfyUI Server URL": "ComfyUI 服务地址",
    "Compiling templates...": "正在编译模板...",
    "Concise": "简洁",
    "Configure advanced AI features.": "配置高级 AI 功能。",
    "Configure web access and advanced AI features.":
      "配置联网访问和高级 AI 功能。",
    "Configure the selected image provider before continuing.":
      "继续前请先配置所选生图提供商。",
    "Configure web search": "配置联网搜索",
    "Content generated": "内容已生成",
    "Content:": "内容：",
    "Continue": "继续",
    "Confirm password": "确认密码",
    "Could not create account": "无法创建账号",
    "Could not load login": "无法加载登录",
    "Could not parse schema from slide code": "无法从幻灯片代码解析结构",
    "Continue to image provider": "继续选择生图提供商",
    "Continue to Preview": "继续预览",
    "Continue to web search": "继续配置联网搜索",
    "Create": "创建",
    "Create account": "创建账号",
    "Create your admin login": "创建管理员登录",
    "Create new presentation": "新建演示文稿",
    "Create new theme": "新建主题",
    "Create presentation": "创建演示文稿",
    "Create Presentation": "创建演示文稿",
    "Create Template": "创建模板",
    "Create new template": "新建模板",
    "Current value": "当前值",
    "Creation failed": "创建失败",
    "Creating your presentation": "正在创建演示文稿",
    "Custom": "自定义",
    "Custom template slide layout": "自定义模板版式",
    "Custom endpoint": "自定义端点",
    "DALL·E 3 Image Quality": "DALL·E 3 图片质量",
    "DOCUMENTS": "文档",
    "Dashboard": "仪表盘",
    "Dashboard sections": "仪表盘栏目",
    "Dashboard sidebar": "仪表盘侧边栏",
    "Decks": "演示文稿",
    "Delete": "删除",
    "Delete Presentation?": "确认删除演示文稿？",
    "Delete Slide": "删除幻灯片",
    "Delete slide": "删除幻灯片",
    "Delete Template": "删除模板",
    "Delete Theme?": "确认删除主题？",
    "Deleting...": "正在删除...",
    "Default": "默认",
    "Default (Model)": "默认（模型）",
    "DeepSeek base URL (optional)": "DeepSeek 基础地址（可选）",
    "DeepSeek API Key": "DeepSeek API 密钥",
    "DeepSeek models via DeepSeek API": "通过 DeepSeek API 使用 DeepSeek 模型",
    "Default (Model) (Off)": "默认（模型）（关闭）",
    "Defaults to localhost:1234/v1, and /v1 is added automatically when omitted.":
      "默认使用 localhost:1234/v1；未填写 /v1 时会自动补上。",
    "Disable Image Generation": "关闭生图",
    "Disable image generation & Continue": "关闭生图并继续",
    "Disable web search & Finish": "关闭联网搜索并完成",
    "Disabled": "已关闭",
    "Documents Preview": "文档预览",
    "Discovering and loading layout components...":
      "正在发现并加载布局组件...",
    "Done": "完成",
    "Drafting your presentation outline": "正在起草演示文稿大纲",
    "Edit": "编辑",
    "Edit content schema": "编辑内容结构",
    "Edit source code": "编辑源代码",
    "Educational": "教育",
    "Enable/Disable Image Generation": "开启/关闭生图",
    "Enable/Disable Web Search": "开启/关闭联网搜索",
    "Enable Web Grounding": "开启联网检索",
    "Enabled": "已开启",
    "End your session on this deployment. You will need to sign in again to use the app and access the API.":
      "结束当前部署上的登录会话。之后需要重新登录才能使用应用和 API。",
    "Enter your API key": "输入你的 API 密钥",
    "Enter your API Key": "输入你的 API 密钥",
    "Enter your URL": "输入你的 URL",
    "Enter markdown content here...": "在这里输入 Markdown 内容...",
    "Describe the presentation you want to generate":
      "描述你想生成的演示文稿",
    "Error loading template": "模板加载失败",
    "Error in radar presentation creation.": "创建演示文稿时出错。",
    "Error in presentation generation.": "演示文稿生成出错。",
    "Exit": "退出",
    "Exit selection mode": "退出选择模式",
    "Edit slide {slide} markdown": "编辑第 {slide} 页 Markdown",
    "Empty outline": "空大纲",
    "Expected structure:": "期望结构：",
    "Export": "导出",
    "Export as": "导出为",
    "FILTER BY:": "筛选：",
    "5min Generation": "5 分钟生成",
    "Failed to generate content.": "生成内容失败。",
    "Failed to load custom template layouts.":
      "加载自定义模板布局失败。",
    "Failed to parse outline stream response.":
      "解析大纲生成流响应失败。",
    "Failed to parse presentation data.": "解析演示文稿数据失败。",
    "Failed to parse schema": "解析结构失败",
    "Failed to regenerate outline.": "重新生成大纲失败。",
    "Family": "字体族",
    "File too large": "文件过大",
    "Finish Setup": "完成设置",
    "Fireworks base URL (optional)": "Fireworks 基础地址（可选）",
    'Font "{font}" is already in your upload list.':
      '字体“{font}”已在上传列表中。',
    'Font "{font}" was added successfully.': '字体“{font}”已成功添加。',
    "Font added": "字体已添加",
    "Font already added": "字体已添加过",
    "Font check failed": "字体检查失败",
    "Font Management": "字体管理",
    "Font file size must be less than 10MB.": "字体文件大小必须小于 10MB。",
    "Font removed": "字体已移除",
    "Fonts": "字体",
    "From colors": "从颜色",
    "Free": "免费版",
    "Funny": "幽默",
    "Generation failed": "生成失败",
    "Generation error": "生成错误",
    "Generating presentation outline...": "正在生成演示文稿大纲...",
    "Generating presentation data...": "正在生成演示文稿数据...",
    "Generating slide layout...": "正在生成幻灯片布局...",
    "Generate a preview before continuing.": "继续前请先生成预览。",
    "Generate a full presentation from my topic": "根据我的主题生成完整演示文稿",
    "Generate": "生成",
    "Generate Presentation": "生成演示文稿",
    "Generate Template": "生成模板",
    "Get API Key": "获取 API 密钥",
    "Get Started": "开始",
    "Go to Upload": "前往上传",
    "Go to home": "返回首页",
    "Go to your dashboard": "前往你的仪表盘",
    "Got it!": "知道了",
    "GPT Image 1.5 Quality": "GPT Image 1.5 图片质量",
    "Help": "帮助",
    "Help improve Presenton by sharing anonymous usage data.":
      "分享匿名使用数据，帮助改进 Presenton。",
    "It might take a few minutes for large documents.":
      "大型文档可能需要几分钟时间。",
    "Image Generation Settings": "生图设置",
    "Image API key": "生图 API 密钥",
    "Image Provider": "生图提供商",
    "Image Too Large": "图片过大",
    "Image generation disabled": "生图已关闭",
    "Image model id": "图片模型 ID",
    "Item Fields": "项目字段",
    "Image provider unavailable": "生图提供商不可用",
    "Improve this slide content": "优化此页内容",
    "Improve your slides...": "优化你的幻灯片...",
    "Include Table of Content": "包含目录页",
    "In Built": "内置",
    "Input required": "请输入内容",
    "Important:": "重要：",
    "Initializing Application": "正在初始化应用",
    "Initialization failed": "初始化失败",
    "Invalid font file": "字体文件无效",
    "Invalid layout code": "布局代码无效",
    "Language required": "请选择语言",
    "Layout not selected": "未选择布局",
    "LiteLLM base URL": "LiteLLM 基础地址",
    "LM Studio base URL": "LM Studio 基础地址",
    "Loading configuration and checking model availability...":
      "正在加载配置并检查模型可用性...",
    "Loading custom template...": "正在加载自定义模板...",
    "Loading custom templates...": "正在加载自定义模板...",
    "Loading layouts": "正在加载布局",
    "Loading presentation": "正在加载演示文稿",
    "Loading...": "加载中...",
    "Login unavailable": "登录服务不可用",
    "Make sure both password fields match before continuing.":
      "请确认两次输入的密码一致。",
    "Max 100MB": "最大 100MB",
    "Max chars": "最大字符数",
    "Max items": "最大项数",
    "Max value": "最大值",
    "Maximum results": "最大结果数",
    "Min chars": "最小字符数",
    "Missing Fonts": "缺失字体",
    "Min items": "最小项数",
    "Min value": "最小值",
    "Medium": "中等",
    "Model": "模型",
    "Model Controls": "模型控制",
    "Model name": "模型名称",
    "My First Presentation": "我的第一个演示文稿",
    "New": "新建",
    "New Theme": "新建主题",
    "New Themes": "新建主题",
    "New Template": "新建模板",
    "New presentation": "新建演示文稿",
    "Next": "下一步",
    "No image provider": "未选择生图提供商",
    "No editable fields": "没有可编辑字段",
    "No language found.": "未找到语言。",
    "No layouts available.": "暂无可用布局。",
    "No Layouts Found": "未找到布局",
    "No model found.": "未找到模型。",
    "No models found. Please make sure your API key is valid and has access to models.":
      "未找到模型。请确认 API 密钥有效，并且有模型访问权限。",
    "No models found. Please make sure your provider credentials are valid and the selected provider is reachable.":
      "未找到模型。请确认提供商凭据有效，并且当前提供商可以访问。",
    "No presentation id found": "未找到演示文稿 ID",
    "No preview data": "没有预览数据",
    "No provider found.": "未找到提供商。",
    "No outlines available": "暂无大纲",
    "No Prompt or Document Provided": "请提供提示词或文档",
    "No valid layout files were discovered. Make sure your layout components export both a default component and a Schema.":
      "未发现有效的布局文件。请确认布局组件同时导出默认组件和 Schema。",
    "Note:": "注意：",
    "Each slide is sent to your configured text model as a":
      "每页幻灯片都会以",
    "screenshot plus HTML reference": "截图加 HTML 参考",
    ". Only": "的形式发送给你配置的文本模型。只有",
    "vision-capable": "支持视觉输入",
    "models (image input) can use the layout faithfully. Text-only models may error or produce weak layouts; pick a vision model in Settings for your provider.":
      "的模型才能忠实还原版式。纯文本模型可能报错或生成效果较弱，请在设置中为你的提供商选择视觉模型。",
    "Note: Each slide is sent to your configured text model as a screenshot plus HTML reference. Only vision-capable models (image input) can use the layout faithfully. Text-only models may error or produce weak layouts; pick a vision model in Settings for your provider.":
      "注意：每页幻灯片都会以截图加 HTML 参考的形式发送给你配置的文本模型。只有支持视觉输入的模型才能忠实还原版式。纯文本模型可能报错或生成效果较弱，请在设置中为你的提供商选择视觉模型。",
    "Nothing to redo": "没有可重做的操作",
    "Nothing to undo": "没有可撤销的操作",
    "Open Panel": "打开面板",
    "Open WebUI URL": "Open WebUI 地址",
    "OpenAI Compatible API Key": "OpenAI 兼容 API 密钥",
    "OpenAI Compatible URL": "OpenAI 兼容地址",
    "OpenAI-compatible /v1/images endpoint (LiteLLM, Azure, vLLM, etc.)":
      "OpenAI 兼容的 /v1/images 端点（LiteLLM、Azure、vLLM 等）",
    "OpenAI-compatible base URL": "OpenAI 兼容基础地址",
    "OpenAI-compatible LLM": "OpenAI 兼容大语言模型",
    "OpenAI-compatible LiteLLM proxy or gateway": "OpenAI 兼容的 LiteLLM 代理或网关",
    "OpenAI-compatible URL": "OpenAI 兼容地址",
    "OpenAI-compatible root (usually ends with /v1); /v1 is added if omitted. API key above is optional for local proxies with no auth.":
      "OpenAI 兼容根地址（通常以 /v1 结尾）；未填写 /v1 时会自动补上。若本地代理不需要认证，上方 API 密钥可不填。",
    "One-time setup for this deployment. You will use the same username and password on future visits.":
      "这是此部署的一次性初始化。之后访问时将使用同一组用户名和密码。",
    "Optional": "可选",
    "Outline Error": "大纲错误",
    "Outline & Content": "大纲与内容",
    "Outline ready": "大纲已就绪",
    "Outline streaming failed": "大纲生成流失败",
    "Outline title": "大纲标题",
    "Outlines not ready": "大纲尚未就绪",
    "Other": "其他",
    "(Office docs, spreadsheets, images, PDF/TXT)":
      "（Office 文档、表格、图片、PDF/TXT）",
    "PPTX. Only": "仅支持 PPTX",
    "Page not found": "页面未找到",
    "Password": "密码",
    "Password too short": "密码太短",
    "Passwords do not match": "两次密码不一致",
    "Paste URL or code…": "粘贴 URL 或验证码…",
    "Paste your ComfyUI workflow JSON here (export via \"Export (API)\" in ComfyUI)":
      "在这里粘贴 ComfyUI 工作流 JSON（从 ComfyUI 的 “Export (API)” 导出）",
    "Please choose a language before processing uploaded documents.":
      "处理上传文档前请先选择语言。",
    "Please choose a language before regenerating from documents":
      "从文档重新生成前请先选择语言",
    "Please select a language.": "请选择语言。",
    "Please select a template first": "请先选择模板",
    "Please select language": "请选择语言",
    "Please try again": "请重试",
    "Please upload .ttf, .otf, .woff, .woff2, or .eot files.":
      "请上传 .ttf、.otf、.woff、.woff2 或 .eot 字体文件。",
    "Select Template": "选择模板",
    "Select {template} template": "选择 {template} 模板",
    "{count} Layouts": "{count} 个布局",
    "Please wait": "请稍候",
    "Presentation (": "演示文稿（",
    "Preparing your workspace...": "正在准备工作区...",
    "Preparing your workspace…": "正在准备工作区…",
    "Preparing outline generation...": "正在准备生成大纲...",
    "Preparing your presentation outline": "正在准备演示文稿大纲",
    "Presentation": "演示文稿",
    "Presentation deleted": "演示文稿已删除",
    "Presentation streaming failed": "演示文稿生成流失败",
    "Preview": "预览",
    "Preview failed": "预览失败",
    "Preview generated": "预览已生成",
    "Preview generation failed": "预览生成失败",
    "Slides preview was generated successfully.": "幻灯片预览已成功生成。",
    "Processing": "处理中",
    "Processing documents...": "正在处理文档...",
    "Processing slides": "正在处理幻灯片",
    "Processing...": "处理中...",
    "Pro": "专业版",
    "Professional": "专业",
    "Project ID": "项目 ID",
    "Prompt": "提示词",
    "Prompt required": "请输入提示词",
    "Provide a prompt or upload at least one document.":
      "请输入提示词，或至少上传一个文档。",
    "Re-Design this slide": "重新设计此页",
    "Re-Construct": "重新构建",
    "Region": "区域",
    "Refresh Page": "刷新页面",
    "Refresh token": "刷新令牌",
    "Re-enter your password": "再次输入密码",
    "Regenerate": "重新生成",
    "Regenerate outline": "重新生成大纲",
    "Regenerating": "正在重新生成",
    "Reconnecting to outline stream": "正在重新连接大纲生成流",
    "Regenerate Presentation": "重新生成演示文稿",
    "Regenerate Presentation?": "确认重新生成演示文稿？",
    "Redo": "重做",
    "Ready to generate your template. Each slide will be converted to a reusable React component.":
      "已准备好生成模板。每页幻灯片都会被转换为可复用的 React 组件。",
    "Redo (Ctrl+Shift+Z)": "重做（Ctrl+Shift+Z）",
    "Rename presentation": "重命名演示文稿",
    "Reset Theme": "重置主题",
    "Reset chat": "重置聊天",
    "Rewrite this content professionally": "以专业风格改写此内容",
    "Runs locally on your device. Your API keys and generation setup stay on your machine.":
      "在你的设备本地运行。API 密钥和生成配置都会保留在你的机器上。",
    "Save": "保存",
    "Save & Finish": "保存并完成",
    "Save Configuration": "保存配置",
    "Sales Pitch": "销售演示",
    "Saving credentials...": "正在保存凭据...",
    "Saving Configuration...": "正在保存配置...",
    "Saving your template. This may take a moment…":
      "正在保存模板，可能需要一点时间…",
    "Schema": "结构",
    "Schema Editor": "结构编辑器",
    "Search language...": "搜索语言...",
    "Search model...": "搜索模型...",
    "Search models...": "搜索模型...",
    "Search models…": "搜索模型…",
    "Search provider...": "搜索提供商...",
    "Secure instance": "安全实例",
    "Send": "发送",
    "Select": "选择",
    "Select Provider": "选择提供商",
    "Select a Template": "选择模板",
    "Select Slides": "选择页数",
    "Select Text Provider": "选择文本生成提供商",
    "Select Image Provider": "选择生图提供商",
    "Select Web Search Provider": "选择联网搜索提供商",
    "Select a model": "选择模型",
    "Select a quality": "选择质量",
    "Select a PPTX file": "请选择 PPTX 文件",
    "Select image provider": "选择生图提供商",
    "Select image model": "选择生图模型",
    "Select language": "选择语言",
    "Select text provider": "选择文本生成提供商",
    "Select tone": "选择语气",
    "Select verbosity": "选择详略程度",
    "Select web search provider": "选择联网搜索提供商",
    "Session refresh failed": "会话刷新失败",
    "Session refreshed": "会话已刷新",
    "Setup is complete for this instance. Use the username and password you configured.":
      "此实例已完成初始化。请使用你配置的用户名和密码登录。",
    "Settings": "设置",
    "Settings saved": "设置已保存",
    "Sign in required": "需要登录",
    "Sign in": "登录",
    "Sign in to continue": "登录后继续",
    "Sign in to view this page.": "请登录后查看此页面。",
    "Sign in with ChatGPT": "使用 ChatGPT 登录",
    "Sign in with your new username and password to continue.":
      "请使用新的用户名和密码登录后继续。",
    "Signed in": "已登录",
    "Sign out": "退出登录",
    "Signing in...": "正在登录...",
    "Sign-in failed": "登录失败",
    "Sign-out failed": "退出登录失败",
    "Signed out": "已退出登录",
    "Signed in to ChatGPT": "已登录 ChatGPT",
    "Slide Presentation": "幻灯片演示",
    "Slide": "幻灯片",
    "Slide Preview": "幻灯片预览",
    "Slide layout": "幻灯片布局",
    "Slide edit failed": "幻灯片编辑失败",
    "Slide reconstructed": "幻灯片已重建",
    "Slide {slide} failed": "第 {slide} 页失败",
    "Slide {slide} was reconstructed successfully.":
      "第 {slide} 页已成功重建。",
    "Slide updated": "幻灯片已更新",
    "Smart": "智能",
    "Some images could not be generated": "部分图片无法生成",
    "Some slides could not be processed": "部分幻灯片处理失败",
    "Something went wrong": "出错了",
    "Something went wrong while contacting the provider. Check your network and try again.":
      "连接提供商时出错。请检查网络后重试。",
    "Something went wrong while adding the new slide.":
      "添加新幻灯片时出错。",
    "Something went wrong while creating the presentation.":
      "创建演示文稿时出错。",
    "Something went wrong while saving.": "保存时出错。",
    "Something went wrong. Please try again.": "出错了，请重试。",
    "Speaker notes": "演讲备注",
    "Standard": "标准",
    "Starting...": "正在开始...",
    "Start with ChatGPT, run a local model, or connect another AI provider.":
      "从 ChatGPT 开始，也可以运行本地模型或连接其他 AI 提供商。",
    "Start creating the first one.": "开始创建第一个吧。",
    "Stop chat response": "停止聊天回复",
    "String": "字符串",
    "Selection Edit Mode — Click on any element to edit with AI":
      "选择编辑模式 — 点击任意元素用 AI 编辑",
    "Set min/max character limits for each field. This controls how much text AI generates for your slide.":
      "为每个字段设置最小/最大限制，用于控制 AI 为该页生成多少文本。",
    "Submit": "提交",
    "SUGGESTIONS": "建议",
    "Template Studio": "模板工作室",
    "Template deleted": "模板已删除",
    "Template initialized": "模板已初始化",
    "Template not found": "未找到模板",
    "Templates": "模板",
    "Text Generation Settings": "文本生成设置",
    "Text Heavy": "文字较多",
    "Text Provider": "文本生成提供商",
    "The theme was removed from your library.": "该主题已从你的库中移除。",
    "The template was deleted successfully.": "模板已成功删除。",
    "Template creation was initialized successfully.":
      "模板创建已成功初始化。",
    "The login service is unavailable right now. Please try again in a moment.":
      "登录服务暂时不可用，请稍后重试。",
    "The username or password is incorrect. Please try again.":
      "用户名或密码错误，请重试。",
    "The font was removed from your upload list.":
      "该字体已从上传列表中移除。",
    "Theme": "主题",
    "Themes": "主题",
    "Thinking": "思考中",
    "This slide's image exceeds the 5MB limit. Try using a smaller resolution PPTX file or compressing the images.":
      "这页图片超过 5MB 限制。请尝试使用分辨率更低的 PPTX，或压缩图片。",
    "This action cannot be undone.": "此操作无法撤销。",
    "Are you sure you want to delete this template? This action cannot be undone.":
      "确定要删除这个模板吗？此操作无法撤销。",
    "This can take a few minutes depending on slide count.":
      "根据页数不同，这可能需要几分钟。",
    "This deployment is protected. Enter your credentials to open the app.":
      "此部署已受保护。请输入凭据以打开应用。",
    "Title Slide": "标题页",
    "Toggle deck sort order": "切换演示文稿排序",
    "Tone": "语气",
    "Together base URL (optional)": "Together 基础地址（可选）",
    "Try again": "重试",
    "Type:": "类型：",
    "Unknown": "未知",
    "Undo": "撤销",
    "Undo (Ctrl+Z)": "撤销（Ctrl+Z）",
    "Update slide using prompt": "用提示词更新幻灯片",
    "Unsaved": "未保存",
    "Updating slides...": "正在更新幻灯片...",
    "Upload": "上传",
    "Upload Custom Font": "上传自定义字体",
    "Upload missing fonts to ensure your presentation displays correctly.":
      "上传缺失字体，确保演示文稿正确显示。",
    "Upload your PPTX file to extract slides and convert them to a template which you can use to generate AI presentations.":
      "上传 PPTX 文件，提取幻灯片并转换成可用于生成 AI 演示文稿的模板。",
    "Upload Font File": "上传字体文件",
    "Upload must match this name exactly": "上传文件必须与该名称完全匹配",
    "Uploaded Fonts": "已上传字体",
    "Upload PPTX File": "上传 PPTX 文件",
    "Uploading font...": "正在上传字体...",
    "Uploading logo...": "正在上传 Logo...",
    "Usage analytics": "使用分析",
    "Usage Analytics": "使用分析",
    "Unauthorized": "未授权",
    "Username": "用户名",
    "Username too short": "用户名太短",
    "Verbosity": "详略程度",
    "Vision-capable text model required": "需要支持视觉输入的文本模型",
    "Choose a text model that accepts images in Settings, save, and try again.":
      "请在设置中选择支持图片输入的文本模型，保存后重试。",
    "Waiting for sign-in": "等待登录",
    "Waiting for sign-in…": "等待登录…",
    "Web Search": "联网搜索",
    "Web Search Settings": "联网搜索设置",
    "Web Search Provider": "联网搜索提供商",
    "Web search disabled": "联网搜索已关闭",
    "Web research complete": "联网研究已完成",
    "Welcome on board!": "欢迎加入！",
    "Workflow JSON": "工作流 JSON",
    "What changes would you like? e.g., 'Make the title larger' or 'Change colors to blue theme'":
      "你想做什么修改？例如“把标题调大”或“改成蓝色主题”",
    "Write prompt": "填写提示词",
    "Write instructions": "填写说明",
    "We could not connect to the login service. Please refresh and try again.":
      "无法连接登录服务，请刷新后重试。",
    "Welcome back. Loading your workspace.": "欢迎回来，正在加载工作区。",
    "You are about to delete": "你即将删除",
    "You don't have any presentations yet.": "你还没有任何演示文稿。",
    "Your password must be at least 6 characters.":
      "密码必须至少 6 个字符。",
    "You’re all set. Let’s create your first presentation.":
      "一切就绪。来创建你的第一个演示文稿吧。",
    "Your username must be at least 3 characters.":
      "用户名必须至少 3 个字符。",
    "You can continue without all fonts, but some text may not display correctly.":
      "你可以在字体不完整时继续，但部分文字可能无法正确显示。",
    "You have been disconnected from ChatGPT.": "你已断开 ChatGPT 连接。",
    "Your ChatGPT account is connected and ready to use.":
      "你的 ChatGPT 账号已连接，可以使用。",
    "Your ChatGPT connection was renewed successfully.":
      "你的 ChatGPT 连接已成功续期。",
    "Your ChatGPT session could not be renewed. Please sign in again.":
      "你的 ChatGPT 会话无法续期，请重新登录。",
    "Your API key will be stored locally and never shared":
      "你的 API 密钥只会保存在本地，不会被共享。",
    "Your Uploaded Fonts": "你上传的字体",
    "Your changes were applied to this slide.": "你的更改已应用到此页。",
    "Your configuration was saved successfully.": "你的配置已成功保存。",
    "Every slide was reconstructed successfully.":
      "每页幻灯片都已成功重建。",
    "or drag & drop.": "或拖拽到这里。",
    "slides": "页",
    "Start with your idea… we’ll handle the slides":
      "从你的想法开始…剩下的幻灯片交给我们",
    "Guide the AI: define audience, tone, key points, or constraints.":
      "指导 AI：定义受众、语气、重点或限制。",
    "Turn prompts or documents into presentations with AI":
      "用 AI 将提示词或文档转成演示文稿",
    "The presentation was removed from your dashboard.":
      "该演示文稿已从仪表盘移除。",
    "Could not delete presentation": "无法删除演示文稿",
    "Could not delete template": "无法删除模板",
    "Something went wrong while deleting the presentation.":
      "删除演示文稿时出错。",
    "Something went wrong while deleting the template.":
      "删除模板时出错。",
    "A presentation must contain at least one slide.":
      "演示文稿至少需要保留一页。",
    "Please enter a prompt before submitting.": "提交前请输入提示词。",
    "The server did not return an updated slide. Please try again.":
      "服务器没有返回更新后的幻灯片，请重试。",
    "The server could not list models. Check your API key or endpoint and try again.":
      "服务器无法列出模型。请检查 API 密钥或端点后重试。",
    "Something went wrong while editing the slide.":
      "编辑幻灯片时出错。",
    "Connection failed": "连接失败",
    "Failed to connect to the server. Please try again.":
      "无法连接服务器，请重试。",
    "Failed to parse stream response.": "解析生成流响应失败。",
    "Failed to parse final presentation payload.":
      "解析最终演示文稿数据失败。",
    "Parse failed": "解析失败",
    "Please wait for your outlines to finish generating before continuing.":
      "请等待大纲生成完成后再继续。",
    "Stream parse failed": "生成流解析失败",
    "Template error": "模板错误",
    "We couldn't load your presentation. Please try again.":
      "无法加载你的演示文稿，请重试。",
    "Are you sure you want to delete slide {slide}? This action cannot be undone.":
      "确定要删除第 {slide} 页吗？此操作无法撤销。",
    "Character Limits": "内容限制",
    "Collapse all": "全部收起",
    "Expand all": "全部展开",
    "Low": "少量",
    "Number": "数字",
    "Sidebar title": "侧边栏标题",
    "Sections": "章节",
    "Section": "章节",
    "Heading": "标题",
    "Items": "项目",
    "Item": "项目",
    "{field} Properties": "{field} 属性",
    "{mode} content was generated successfully.": "{mode}内容已生成。",
    "{processed} of {total} slides were reconstructed. {failed} slide(s) failed — review them and try again.":
      "{total} 页中已重建 {processed} 页，{failed} 页失败。请检查后重试。",
    "{count} slides ready": "{count} 页已就绪",
    "{count} fonts applied": "已应用 {count} 个字体",
    "changed": "已更改",
    "chars": "字符",
    "clicked": "已选中",
    "AI Generate": "AI 生成",
    "Add your {provider} API key in Settings to search stock images.":
      "请在设置中添加 {provider} API 密钥以搜索图库图片。",
    "Adding an outline slide.": "正在添加大纲页。",
    "Applying the selected theme.": "正在应用所选主题。",
    "Attachments are not supported yet": "暂不支持附件",
    "Changes were saved, but refresh failed.":
      "更改已保存，但刷新失败。",
    "Chat completed, but refresh failed.": "聊天已完成，但刷新失败。",
    "Chat error": "聊天错误",
    "Checking available color themes.": "正在检查可用配色主题。",
    "Checking available layouts.": "正在检查可用布局。",
    "Click anywhere to set focus point": "点击任意位置设置焦点",
    "Click to Change Focus Point": "点击更改焦点",
    "Click to upload an image": "点击上传图片",
    "Click to use this image": "点击使用此图片",
    "Contain": "完整显示",
    "Could not delete image": "无法删除图片",
    "Could not load images": "无法加载图片",
    "Cover": "裁切填充",
    "Current Image": "当前图片",
    "Current Prompt": "当前提示词",
    "Deleting the outline slide.": "正在删除大纲页。",
    "Deleting the slide.": "正在删除幻灯片。",
    "Describe the image you want to generate...": "描述你想生成的图片...",
    "Disable follow AI mode": "关闭跟随 AI 模式",
    "Enable follow AI mode": "开启跟随 AI 模式",
    "Failed to delete image. Please try again.": "删除图片失败，请重试。",
    "Failed to generate image. Please try again.": "生成图片失败，请重试。",
    "Failed to get previous generated images. Please try again.":
      "获取历史生成图片失败，请重试。",
    "Failed to get uploaded images. Please try again.":
      "获取已上传图片失败，请重试。",
    "Failed to upload image. Please try again.": "上传图片失败，请重试。",
    "File size should be less than 5MB": "文件大小应小于 5MB",
    "Fill": "拉伸填满",
    "Follow AI is off": "跟随 AI 已关闭",
    "Follow AI is on: auto-jump to active slide":
      "跟随 AI 已开启：自动跳转到当前处理页",
    "Found the requested information.": "已找到请求的信息。",
    "Found the requested outline details.": "已找到请求的大纲详情。",
    "Found the requested slide details.": "已找到请求的幻灯片详情。",
    "Generate Image": "生成图片",
    "Generating images and icons.": "正在生成图片和图标。",
    "Generating...": "生成中...",
    "Image Description": "图片描述",
    "Image deleted": "图片已删除",
    "Image generation failed": "图片生成失败",
    "Live": "实时",
    "Loading chat…": "正在加载聊天记录…",
    "Maximum file size: 5MB": "最大文件大小：5MB",
    "No images found. Try different keywords.":
      "未找到图片，请换个关键词试试。",
    "Object Fit": "图片适应方式",
    "Opening the selected slide.": "正在打开所选幻灯片。",
    "Outline adder": "大纲添加器",
    "Outline draft reader": "大纲草稿读取器",
    "Outline editor": "大纲编辑器",
    "Outline reader": "大纲读取器",
    "Outline remover": "大纲删除器",
    "Outline reorderer": "大纲重排器",
    "Planning tool steps.": "正在规划工具步骤。",
    "Planning tools": "正在规划工具",
    "Please enter a prompt": "请输入提示词",
    "Please enter search keywords": "请输入搜索关键词",
    "Please upload an image file": "请上传图片文件",
    "Presentation not ready": "演示文稿尚未就绪",
    "Previous Generated Images": "历史生成图片",
    "QUICK PROMPTS": "快捷提示",
    "Reading the outline draft.": "正在读取大纲草稿。",
    "Reading the presentation outline.": "正在读取演示文稿大纲。",
    "Refresh failed": "刷新失败",
    "Regenerate this outline": "重新生成此大纲",
    "Reorder sections": "重排章节",
    "Reordering outline slides.": "正在重排大纲页。",
    "Results — click an image to use it": "搜索结果 — 点击图片即可使用",
    "Reviewing your presentation context.": "正在检查演示文稿上下文。",
    "Run a search to see thumbnails from": "运行搜索以查看来自",
    "Run a search to see thumbnails from {provider}.":
      "运行搜索以查看来自 {provider} 的缩略图。",
    "Running": "正在运行",
    "Saving slide updates.": "正在保存幻灯片更新。",
    "Search keywords": "搜索关键词",
    "Search stock images": "搜索图库图片",
    "Searching slides for relevant content.": "正在搜索相关幻灯片内容。",
    "Searching…": "搜索中…",
    "Searching with model-native web search and drafting outlines":
      "正在使用模型原生联网搜索并起草大纲",
    "Schema checker": "结构检查器",
    "Shorten outline": "精简大纲",
    "Slide reader": "幻灯片读取器",
    "Slide remover": "幻灯片删除器",
    "Slide saver": "幻灯片保存器",
    "Slide search": "幻灯片搜索",
    "Split large sections": "拆分较长章节",
    "Stock search": "图库搜索",
    "Stock search failed. Please try again.": "图库搜索失败，请重试。",
    "Stop": "停止",
    "The image was removed from your uploads.": "图片已从上传列表中移除。",
    "The presentation is not ready yet.": "演示文稿尚未准备好。",
    "Tools called": "已调用工具",
    "Update Image": "更新图片",
    "Updating the outline slide.": "正在更新大纲页。",
    "Upload failed": "上传失败",
    "Uploaded Image Preview": "已上传图片预览",
    "Uploaded Images:": "已上传图片：",
    "Uploading your image...": "正在上传图片...",
    "Use": "使用",
    "Validating the slide schema.": "正在校验幻灯片结构。",
    "Working on it...": "正在处理...",
    "Asset generator": "素材生成器",
    "Apply styles to entire presentation": "应用样式到整个演示文稿",
    "Blank Slide": "空白幻灯片",
    "Choose the visual weight used for icon search and replacement.":
      "选择用于图标搜索和替换的视觉粗细。",
    "Clear all": "全部清除",
    "Create new themes": "新建主题",
    "Failed to load layouts. Please check your layout files and try again.":
      "加载布局失败。请检查布局文件后重试。",
    "Files selected": "文件已选择",
    "Double-click for AI edit": "双击进行 AI 编辑",
    "Find an Icon": "查找图标",
    "Icon Customizer": "图标自定义",
    "Icon Weight": "图标粗细",
    "Layout": "布局",
    "Loading Layouts": "正在加载布局",
    "Maximum file limit reached": "已达到文件数量上限",
    "No icons found": "未找到图标",
    "Open AI Editor": "打开 AI 编辑器",
    "Replace Icons": "替换图标",
    "Remove {file}": "移除 {file}",
    "Report": "报告",
    "Some files are not supported": "部分文件不受支持",
    "Select icon {index}": "选择图标 {index}",
    "Slides": "幻灯片",
    "Supported: Word, PowerPoint, spreadsheets, PDF/TXT, and image files.":
      "支持：Word、PowerPoint、表格、PDF/TXT 和图片文件。",
    "Template": "模板",
    "Try a different search term.": "试试其他搜索词。",
    "This slide is empty. Please add content to it using the edit button.":
      "这页是空白的。请使用编辑按钮添加内容。",
    "You can upload up to {count} documents only.":
      "最多只能上传 {count} 个文档。",
    "not found in": "未在",
    "unknown": "未知",
    "{count} attachment(s)": "{count} 个附件",
    "{count} file(s) have been added.": "已添加 {count} 个文件。",
    "(optional)": "（可选）",
    "COMPANY": "公司",
    "Cancel editing title": "取消编辑标题",
    "Cancel · Esc": "取消 · Esc",
    "Could not delete slide": "无法删除幻灯片",
    "Could not load themes": "无法加载主题",
    "Describe how this slide should be improved.":
      "描述你想如何优化这页幻灯片。",
    "Description": "描述",
    "Edit selection": "编辑选区",
    "Edit speaker notes": "编辑演讲备注",
    "Enter your prompt here...": "在这里输入提示词...",
    "Experimental export failed": "实验性导出失败",
    "Explain the changes you want to make to the selection eg. make the heading larger":
      "说明你想对选区做什么修改，例如把标题调大",
    "Export complete": "导出完成",
    "Export failed": "导出失败",
    "Exporting PDF": "正在导出 PDF",
    "Exporting PPTX": "正在导出 PPTX",
    "Exporting experimental PPTX": "正在导出实验性 PPTX",
    "Enhanced PPTX export (experimental)": "增强PPTX导出（实验）",
    "Expand outline": "扩展大纲",
    "Failed to load themes.": "加载主题失败。",
    "Font": "字体",
    "fonts": "字体",
    "Give your template a clear name and an optional description to find it later.":
      "给模板起一个清晰的名称，并可添加描述，方便之后查找。",
    "Improve conclusion": "优化结论",
    "Improve introduction": "优化引言",
    "LOGO": "Logo",
    "Layout finder": "布局查找器",
    "Layout saved": "布局已保存",
    "Failed to save layout": "保存布局失败",
    "Failed to save layout components": "保存布局组件失败",
    "Could not save layout": "无法保存布局",
    "No slides to save": "没有可保存的幻灯片",
    "Add at least one slide before saving the layout.":
      "保存布局前请至少添加一张幻灯片。",
    "Some layout components could not be saved. Please try again.":
      "部分布局组件未能保存，请重试。",
    "Center Title Eyebrow Four Details": "居中标题眉题四项详情",
    "A cover slide with a centered eyebrow, large title, divider line, and four centered detail items.":
      "封面页版式：包含居中的眉题、大标题、分隔线和四个居中详情项。",
    "Merge similar slides": "合并相似幻灯片",
    "Present": "演示",
    "Presentation title": "演示文稿标题",
    "Save Template": "保存模板",
    "Save title": "保存标题",
    "Save · Enter": "保存 · Enter",
    "Saving...": "正在保存...",
    "Something went wrong while deleting the slide.":
      "删除幻灯片时出错。",
    "Template Name": "模板名称",
    "The dom-to-pptx export could not complete. The standard PPTX export is still available.":
      "dom-to-pptx 导出未能完成，仍可使用标准 PPTX 导出。",
    "Theme applier": "主题应用器",
    "Theme catalog": "主题目录",
    "This will replace the current slides with a newly generated version and clear undo history. Your current edits may be lost.":
      "这会用新生成的版本替换当前幻灯片，并清空撤销历史。你当前的编辑可能会丢失。",
    "Update": "更新",
    "Update slide": "更新幻灯片",
    "Updating...": "正在更新...",
    "Using the dom-to-pptx engine for an editable export.":
      "正在使用 dom-to-pptx 引擎导出可编辑文件。",
    "We are having trouble exporting your presentation. Please try again.":
      "导出演示文稿时遇到问题，请重试。",
    "Your PDF file has been downloaded.": "你的 PDF 文件已下载。",
    "Your PPTX file has been downloaded.": "你的 PPTX 文件已下载。",
    "Your experimental PPTX file has been downloaded.":
      "你的实验性 PPTX 文件已下载。",
    "Your presentation is being exported. This may take a moment.":
      "正在导出演示文稿，可能需要一点时间。",
    "AI-native web search with extracted result highlights.":
      "AI 原生网页搜索，并提取结果亮点。",
    "Anthropic's Claude models": "Anthropic Claude 模型",
    "AWS Bedrock foundation models": "AWS Bedrock 基础模型",
    "Azure-hosted OpenAI deployments": "Azure 托管的 OpenAI 部署",
    "Base URL (include /v1)": "基础地址（包含 /v1）",
    "Brave Search API for web search results.": "使用 Brave Search API 获取网页搜索结果。",
    "Cerebras Cloud via OpenAI-compatible API": "通过 OpenAI 兼容 API 使用 Cerebras Cloud",
    "ChatGPT Plus/Pro via OAuth": "通过 OAuth 使用 ChatGPT Plus/Pro",
    "Choose a model your server exposes for image generation.":
      "请选择你的服务器暴露出来用于生图的模型。",
    "Could not load models": "无法加载模型",
    "Fireworks AI via OpenAI-compatible API": "通过 OpenAI 兼容 API 使用 Fireworks AI",
    "Free images and videos": "免费图片和视频",
    "Free stock photo and video platform": "免费图库照片和视频平台",
    "Google's advanced image generation model": "Google 高级生图模型",
    "Google's fast image generation model": "Google 快速生图模型",
    "Google's primary text generation model": "Google 主力文本生成模型",
    "Google Vertex AI models": "Google Vertex AI 模型",
    "Key for your image endpoint": "你的生图端点密钥",
    "Local LM Studio OpenAI-compatible server": "本地 LM Studio OpenAI 兼容服务",
    "Many models through OpenRouter’s OpenAI-compatible API":
      "通过 OpenRouter 的 OpenAI 兼容 API 使用多种模型",
    "Ollama's primary text generation model": "Ollama 主力文本生成模型",
    "OpenAI's image generation model": "OpenAI 生图模型",
    "OpenAI's latest text generation model": "OpenAI 最新文本生成模型",
    "Presenton will use model-native web grounding when available. If the selected text model does not support it, web search stays off until you choose an external provider.":
      "可用时 Presenton 会使用模型原生联网检索。如果所选文本模型不支持，联网搜索会保持关闭，直到你选择外部提供商。",
    "Search API optimized for AI applications.": "面向 AI 应用优化的搜索 API。",
    "Together AI via OpenAI-compatible API": "通过 OpenAI 兼容 API 使用 Together AI",
    "Use a self-hosted SearXNG instance.": "使用自托管的 SearXNG 实例。",
    "Use model-native web grounding when available. Otherwise web search stays off until you choose an external provider.":
      "可用时使用模型原生联网检索。否则联网搜索会保持关闭，直到你选择外部提供商。",
    "Use your local ComfyUI server with custom workflows":
      "使用本地 ComfyUI 服务和自定义工作流",
    "Use your Open WebUI server for image generation":
      "使用你的 Open WebUI 服务进行生图",
    "completed.": "已完成。",
    "e.g., Modern Tech Pitch": "例如：现代科技路演",
    "e.g. team collaboration, modern office, sunset mountains…":
      "例如：团队协作、现代办公室、日落群山…",
    "failed.": "失败。",
    "items": "项",
    "your-admin-user": "你的管理员用户名",
  },
};

const zhLayoutTitleTerms: Record<string, string> = {
  agenda: "议程",
  analysis: "分析",
  background: "背景",
  bar: "条形图",
  bullet: "要点",
  bullets: "要点",
  card: "卡片",
  cards: "卡片",
  centered: "居中",
  center: "居中",
  chart: "图表",
  charts: "图表",
  closing: "结束页",
  column: "列",
  columns: "列",
  comparison: "对比",
  contact: "联系信息",
  content: "内容",
  cover: "封面",
  data: "数据",
  description: "描述",
  details: "详情",
  detail: "详情",
  divider: "分隔线",
  eyebrow: "眉题",
  footer: "页脚",
  four: "四个",
  grid: "网格",
  header: "页眉",
  hero: "主视觉",
  icon: "图标",
  icons: "图标",
  image: "图片",
  images: "图片",
  index: "索引",
  intro: "介绍",
  left: "左侧",
  list: "列表",
  media: "媒体",
  metric: "指标",
  metrics: "指标",
  multi: "多项",
  numbered: "编号",
  overview: "概览",
  paragraph: "段落",
  quote: "引用",
  right: "右侧",
  section: "章节",
  sidebar: "侧边栏",
  slide: "幻灯片",
  split: "分栏",
  stat: "统计",
  stats: "统计",
  subtitle: "副标题",
  table: "表格",
  team: "团队",
  three: "三个",
  timeline: "时间线",
  title: "标题",
  toc: "目录",
  two: "两个",
  visual: "视觉",
  with: "带",
};

const zhLayoutDescriptionPhrases: Array<[RegExp, string]> = [
  [/\bA cover slide with\b/gi, "封面页，包含"],
  [/\bA slide with\b/gi, "幻灯片版式，包含"],
  [/\bA layout featuring\b/gi, "版式特点为"],
  [/\bA layout with\b/gi, "版式包含"],
  [/\blarge title\b/gi, "大标题"],
  [/\bcentered eyebrow\b/gi, "居中眉题"],
  [/\bdivider line\b/gi, "分隔线"],
  [/\bfour centered detail items\b/gi, "四个居中详情项"],
  [/\btwo-column\b/gi, "双列"],
  [/\bnumbered list\b/gi, "编号列表"],
  [/\bbullet points\b/gi, "要点"],
  [/\bsupporting image\b/gi, "辅助图片"],
  [/\bright content\b/gi, "右侧内容"],
  [/\bleft column\b/gi, "左侧栏"],
  [/\btop bar\b/gi, "顶部栏"],
  [/\bheader\b/gi, "页眉"],
  [/\bdescription\b/gi, "描述"],
  [/\bgrid\b/gi, "网格"],
  [/\bcards\b/gi, "卡片"],
  [/\btitle\b/gi, "标题"],
  [/\bimage\b/gi, "图片"],
  [/\band\b/gi, "和"],
  [/\bwith\b/gi, "带"],
];

function translateLayoutTitleToZh(text: string): string | null {
  const normalized = text.trim();
  if (!normalized || normalized.length > 80) return null;
  if (/[\u4e00-\u9fff]/.test(normalized)) return null;
  if (!/^[A-Za-z0-9][A-Za-z0-9\s/&+-]*$/.test(normalized)) return null;

  const words = normalized
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .split(/[\s/_-]+/)
    .filter(Boolean);

  if (words.length < 2) return null;

  const translated = words.map((word) => {
    const key = word.toLowerCase();
    return zhLayoutTitleTerms[key] || word;
  });

  const translatedCount = translated.filter((word, index) => word !== words[index]).length;
  if (translatedCount < Math.ceil(words.length / 2)) return null;

  return translated.join("");
}

function translateLayoutDescriptionToZh(text: string): string | null {
  const normalized = text.trim();
  if (!normalized || normalized.length > 240) return null;
  if (/[\u4e00-\u9fff]/.test(normalized)) return null;
  if (!/^(A|An)\s.+\b(slide|layout)\b/i.test(normalized)) return null;

  let translated = normalized;
  for (const [pattern, replacement] of zhLayoutDescriptionPhrases) {
    translated = translated.replace(pattern, replacement);
  }

  if (translated === normalized) return null;
  return translated
    .replace(/\s*,\s*/g, "，")
    .replace(/\s*\.\s*$/g, "。")
    .replace(/\s+/g, " ")
    .replace(/\s([，。])/g, "$1")
    .trim();
}

export function isSupportedLocale(value: string | null): value is Locale {
  return SUPPORTED_LOCALES.includes(value as Locale);
}

export function translateText(locale: Locale, text: string): string {
  if (locale === "en") return text;
  const directTranslation = uiTranslations[locale][text];
  if (directTranslation) return directTranslation;

  if (locale === "zh-CN") {
    const slideCount = text.match(/^(\d+) slides$/i);
    if (slideCount) return `${slideCount[1]} 页`;

    const slideLabel = text.match(/^Slide (\d+)$/i);
    if (slideLabel) return `第 ${slideLabel[1]} 页`;

    const slideProgress = text.match(/^(\d+)\/(\d+) Slides$/i);
    if (slideProgress) return `${slideProgress[1]}/${slideProgress[2]} 页`;

    const charRange = text.match(/^(.+?) chars$/i);
    if (charRange) return `${charRange[1]} 字符`;

    const itemRange = text.match(/^(.+?) items$/i);
    if (itemRange) return `${itemRange[1]} 项`;

    const accountLabel = text.match(/^Account (.+)$/);
    if (accountLabel) return `账号 ${accountLabel[1]}`;

    const webSummary = text.match(/^Web: (.+)$/);
    if (webSummary) {
      const provider = translateText(locale, webSummary[1]);
      return `联网：${provider}`;
    }

    const layoutSaved = text.match(/^Layout "(.+)" was saved successfully\.$/);
    if (layoutSaved) return `布局“${layoutSaved[1]}”已成功保存。`;

    const layoutTitle = translateLayoutTitleToZh(text);
    if (layoutTitle) return layoutTitle;

    const layoutDescription = translateLayoutDescriptionToZh(text);
    if (layoutDescription) return layoutDescription;

    const outlineSearchStatus = text.match(/^Searching with (.+): (.+)$/);
    if (outlineSearchStatus) {
      const provider = translateText(locale, outlineSearchStatus[1]);
      return `正在使用 ${provider} 搜索：${outlineSearchStatus[2]}`;
    }
  }

  return text;
}

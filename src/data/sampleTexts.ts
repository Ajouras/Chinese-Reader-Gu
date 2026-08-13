export interface SampleText {
  id: string;
  title: string;
  lang: 'zh' | 'en';
  level: string;
  category: string;
  content: string;
}

export const SAMPLE_TEXTS: SampleText[] = [
  {
    id: 'sample-zh-story',
    title: '塞翁失马 (The Old Man Lost His Horse)',
    lang: 'zh',
    level: 'Intermediate (HSK 3-4)',
    category: 'Classic Idiom Story',
    content: `在古老的中国，边塞住着一位老人，人们都叫他塞翁。
有一天，塞翁家的一匹好马突然不知去向。邻居们纷纷跑来安慰他，塞翁却笑着说：“马丢了虽然可惜，但怎么知道这不是一件好事呢？”

几个月后，那匹失踪的老马不仅自己回来了，还带回了一匹高大健壮的胡地骏马。邻居们大为惊喜，都跑来向塞翁祝贺。塞翁却皱起眉头说：“白白得了一匹好马，怎么知道这不是祸事呢？”

塞翁的儿子非常喜欢骑这匹骏马。有一天，他不小心从马背上摔了下来，折断了腿。邻居们又跑来安慰，塞翁依然平静地说：“儿子腿摔断了，怎么知道这不是福气呢？”

一年后，边境爆发了战争，所有年轻人都被征召入伍去打仗。由于塞翁的儿子腿有残疾，免于参军，父子俩因此得以在战乱中平安相守。

这个故事告诉我们：祸福相依，坏事可能变成好事，好事也可能蕴含危机。`
  },
  {
    id: 'sample-zh-tech',
    title: '人工智能与未来生活 (AI and Future Life)',
    lang: 'zh',
    level: 'Upper-Intermediate (HSK 4-5)',
    category: 'Technology & Modern Life',
    content: `随着科技的飞速发展，人工智能（AI）已经深刻地改变了我们的日常生活。
从智能手机的语音助手，到自动驾驶汽车，AI技术的应用无处不在。

在语言学习领域，现代人工智能使得跨语言交流变得前所未有的便捷。学习者不仅可以随时随地获取实时翻译，还能通过智能语境分析理解单词深层含义与文化背景。

然而，技术的进步也为人类提出了新的课题：如何在享受科技便利的同时，保持人类独立思考与创造力？这需要我们在探索未知领域的过程中不断寻求平衡。`
  },
  {
    id: 'sample-en-travel',
    title: 'Exploring the Wonders of Beijing (English for Chinese Translation)',
    lang: 'en',
    level: 'Beginner - Intermediate',
    category: 'Travel & Culture',
    content: `Beijing, the capital city of China, is a vibrant metropolis that seamlessly blends ancient history with breathtaking modern architecture.

When visiting Beijing, your first stop should be the Forbidden City, an magnificent imperial palace complex that served as the home of emperors for over five hundred years. Walking through its grand red courtyards feels like stepping back into a timeless chapter of history.

Not far from the city center lies the Great Wall of China, winding gracefully over rolling green mountains. Standing atop this colossal stone structure offers spectacular views and a profound sense of awe.`
  }
];

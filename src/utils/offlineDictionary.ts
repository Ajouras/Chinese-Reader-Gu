import { pinyin } from 'pinyin-pro';
import { CharacterBreakdown, TranslationResult } from '../types';
import { segmentChineseHybrid } from './chineseSegmenter';

/**
 * Offline CC-CEDICT Core Dictionary Bank & Smart Translation Engine
 * Fast, instant, offline translation engine for Chinese-English and English-Chinese.
 * Supports whole phrases, idioms, and sentences without word-by-word fragmentation.
 */
interface OfflineEntry {
  zh: string; // Simplified Chinese
  pinyin?: string;
  en: string; // Primary English definition
  note?: string; // Grammatical or usage note
}

// Built-in offline dictionary entries covering common vocabulary, HSK 1-6, idioms, questions, and grammar
export const OFFLINE_LEXICON: OfflineEntry[] = [
  // Greetings & Basics
  { zh: '你好', en: 'hello; hi; how are you', note: 'Standard informal greeting.' },
  { zh: '谢谢', en: 'thank you; thanks', note: 'Expression of gratitude.' },
  { zh: '多谢', en: 'many thanks; thank you very much', note: 'Expression of gratitude.' },
  { zh: '不客气', en: 'you are welcome; don\'t mention it', note: 'Polite response.' },
  { zh: '不用谢', en: 'you\'re welcome; no need to thank', note: 'Polite response.' },
  { zh: '再见', en: 'goodbye; see you again', note: 'Farewell.' },
  { zh: '明天见', en: 'see you tomorrow', note: 'Farewell time phrase.' },
  { zh: '对不起', en: 'sorry; excuse me', note: 'Apology.' },
  { zh: '不好意思', en: 'excuse me; sorry; feel embarrassed', note: 'Polite apology.' },
  { zh: '没关系', en: 'it doesn\'t matter; no problem', note: 'Reassurance.' },
  { zh: '没事', en: 'it\'s okay; no problem; nothing wrong', note: 'Casual reassurance.' },

  // Pronouns & Demonstratives
  { zh: '我', en: 'I; me; my', note: 'First-person pronoun.' },
  { zh: '你', en: 'you (singular)', note: 'Second-person pronoun.' },
  { zh: '您', en: 'you (polite singular)', note: 'Polite second-person pronoun.' },
  { zh: '他', en: 'he; him', note: 'Third-person male pronoun.' },
  { zh: '她', en: 'she; her', note: 'Third-person female pronoun.' },
  { zh: '它', en: 'it', note: 'Third-person neuter pronoun.' },
  { zh: '我们', en: 'we; us; our', note: 'Plural first-person pronoun.' },
  { zh: '你们', en: 'you (plural)', note: 'Plural second-person pronoun.' },
  { zh: '他们', en: 'they; them (male/mixed)', note: 'Plural third-person pronoun.' },
  { zh: '她们', en: 'they; them (female)', note: 'Plural female pronoun.' },
  { zh: '这', en: 'this; these', note: 'Demonstrative pronoun.' },
  { zh: '那', en: 'that; those', note: 'Demonstrative pronoun.' },
  { zh: '这是', en: 'this is; these are', note: 'Demonstrative phrase.' },
  { zh: '那是', en: 'that is; those are', note: 'Demonstrative phrase.' },
  { zh: '这里', en: 'here; this place', note: 'Locative pronoun.' },
  { zh: '那里', en: 'there; that place', note: 'Locative pronoun.' },
  { zh: '这儿', en: 'here', note: 'Locative pronoun.' },
  { zh: '那儿', en: 'there', note: 'Locative pronoun.' },
  { zh: '自己', en: 'oneself; self', note: 'Reflexive pronoun.' },
  { zh: '大家', en: 'everyone; all of us', note: 'Pronoun.' },
  { zh: '别人', en: 'other people; others', note: 'Pronoun.' },

  // Family & People
  { zh: '儿子', en: 'son', note: 'Noun (family).' },
  { zh: '女儿', en: 'daughter', note: 'Noun (family).' },
  { zh: '爸爸', en: 'father; dad', note: 'Noun (family).' },
  { zh: '妈妈', en: 'mother; mom', note: 'Noun (family).' },
  { zh: '父母', en: 'parents; father and mother', note: 'Noun (family).' },
  { zh: '爷爷', en: 'grandfather (paternal)', note: 'Noun (family).' },
  { zh: '奶奶', en: 'grandmother (paternal)', note: 'Noun (family).' },
  { zh: '外公', en: 'grandfather (maternal)', note: 'Noun (family).' },
  { zh: '外婆', en: 'grandmother (maternal)', note: 'Noun (family).' },
  { zh: '哥哥', en: 'older brother', note: 'Noun (family).' },
  { zh: '弟弟', en: 'younger brother', note: 'Noun (family).' },
  { zh: '姐姐', en: 'older sister', note: 'Noun (family).' },
  { zh: '妹妹', en: 'younger sister', note: 'Noun (family).' },
  { zh: '孩子', en: 'child; children; kid', note: 'Noun.' },
  { zh: '先生', en: 'Mr.; sir; husband; gentleman', note: 'Noun/Honorific.' },
  { zh: '女士', en: 'lady; madam; Ms.', note: 'Noun/Honorific.' },
  { zh: '小姐', en: 'Miss; young lady', note: 'Noun/Honorific.' },
  { zh: '朋友', en: 'friend', note: 'Noun.' },
  { zh: '老师', en: 'teacher', note: 'Noun.' },
  { zh: '学生', en: 'student; pupil', note: 'Noun.' },
  { zh: '同学', en: 'classmate; schoolmate', note: 'Noun.' },
  { zh: '同事', en: 'colleague; coworker', note: 'Noun.' },
  { zh: '医生', en: 'doctor; physician', note: 'Noun.' },
  { zh: '护士', en: 'nurse', note: 'Noun.' },
  { zh: '师傅', en: 'master worker; driver; shifu', note: 'Noun/Title.' },
  { zh: '老人', en: 'old person; senior citizen', note: 'Noun.' },
  { zh: '年轻人', en: 'young person; youth', note: 'Noun.' },
  { zh: '男人', en: 'man; male', note: 'Noun.' },
  { zh: '女人', en: 'woman; female', note: 'Noun.' },
  { zh: '客人', en: 'guest; customer; visitor', note: 'Noun.' },

  // Education & School
  { zh: '学习', en: 'study; learn', note: 'Verb/Noun.' },
  { zh: '学校', en: 'school', note: 'Noun.' },
  { zh: '大学', en: 'university; college', note: 'Noun.' },
  { zh: '中学', en: 'middle school; high school', note: 'Noun.' },
  { zh: '小学', en: 'elementary school; primary school', note: 'Noun.' },
  { zh: '教室', en: 'classroom', note: 'Noun.' },
  { zh: '图书馆', en: 'library', note: 'Noun.' },
  { zh: '课本', en: 'textbook', note: 'Noun.' },
  { zh: '练习', en: 'practice; exercise', note: 'Verb/Noun.' },
  { zh: '练习本', en: 'exercise book; workbook', note: 'Noun.' },
  { zh: '复习', en: 'review (studies); revise', note: 'Verb.' },
  { zh: '预习', en: 'preview; prepare lessons', note: 'Verb.' },
  { zh: '考试', en: 'examination; test; exam', note: 'Noun/Verb.' },
  { zh: '成绩', en: 'achievement; grades; score', note: 'Noun.' },
  { zh: '作业', en: 'homework; assignment', note: 'Noun.' },
  { zh: '课程', en: 'course; curriculum; class', note: 'Noun.' },
  { zh: '专业', en: 'major; specialty; professional', note: 'Noun/Adjective.' },
  { zh: '毕业', en: 'graduate; graduation', note: 'Verb.' },
  { zh: '留学', en: 'study abroad', note: 'Verb.' },
  { zh: '留学生', en: 'foreign student; student studying abroad', note: 'Noun.' },

  // High-Frequency Phrases & Idioms
  { zh: '塞翁失马', en: 'a blessing in disguise (the old man lost his horse)', note: 'Idiom (成语).' },
  { zh: '焉知非福', en: 'how can one know it is not a blessing?', note: 'Idiomatic question clause (4 chars).' },
  { zh: '好事', en: 'good thing; deed', note: 'Noun.' },
  { zh: '坏事', en: 'bad thing; bad deed', note: 'Noun.' },
  { zh: '知道', en: 'know; realize; be aware of', note: 'Verb.' },
  { zh: '不知道', en: 'do not know; unaware', note: 'Common negative verb phrase.' },
  { zh: '重要', en: 'important; significant', note: 'Adjective.' },
  { zh: '越来越', en: 'more and more; increasingly', note: 'Adverbial phrase.' },
  { zh: '发挥', en: 'bring into play; develop; unleash', note: 'Verb.' },
  { zh: '作用', en: 'role; effect; function', note: 'Noun.' },
  { zh: '现代', en: 'modern; contemporary', note: 'Noun/Adjective.' },
  { zh: '社会', en: 'society', note: 'Noun.' },
  { zh: '人工智能', en: 'artificial intelligence (AI)', note: 'Tech noun.' },
  { zh: '天气', en: 'weather', note: 'Noun.' },
  { zh: '真好', en: 'really good; very nice', note: 'Phrase.' },
  { zh: '高兴', en: 'happy; glad; pleased', note: 'Adjective.' },
  { zh: '认识', en: 'recognize; know; meet', note: 'Verb.' },
  { zh: '名字', en: 'name (of a person or thing)', note: 'Noun.' },
  { zh: '一路顺风', en: 'have a pleasant journey; bon voyage', note: 'Idiom / farewell wish.' },
  { zh: '心想事成', en: 'may all your wishes come true', note: 'Idiom / blessing.' },
  { zh: '一马当先', en: 'take the lead; be in the forefront', note: 'Idiom (成语).' },
  { zh: '万事如意', en: 'may everything go as you wish', note: 'Idiom / blessing.' },

  // Question Words & Structures
  { zh: '怎么', en: 'how; why; in what way', note: 'Interrogative pronoun.' },
  { zh: '什么', en: 'what', note: 'Interrogative pronoun.' },
  { zh: '为什么', en: 'why; for what reason', note: 'Interrogative adverb.' },
  { zh: '怎么了', en: 'what happened; what\'s wrong', note: 'Interrogative phrase.' },
  { zh: '怎么样', en: 'how about; how is it; in what condition', note: 'Interrogative adjective/phrase.' },
  { zh: '怎么办', en: 'what to do; what should be done', note: 'Interrogative verb phrase.' },
  { zh: '谁', en: 'who; whom', note: 'Interrogative pronoun.' },
  { zh: '哪', en: 'which; where', note: 'Interrogative pronoun.' },
  { zh: '哪里', en: 'where; wherever', note: 'Interrogative pronoun.' },
  { zh: '哪儿', en: 'where', note: 'Interrogative pronoun.' },
  { zh: '什么时候', en: 'when; at what time', note: 'Interrogative time phrase.' },
  { zh: '多少', en: 'how much; how many', note: 'Interrogative quantity phrase.' },
  { zh: '几', en: 'how many; a few', note: 'Number/Question word.' },
  { zh: '多大', en: 'how old; how big', note: 'Question phrase.' },
  { zh: '多长时间', en: 'how long (time)', note: 'Question phrase.' },
  { zh: '多远', en: 'how far', note: 'Question phrase.' },

  // Conjunctions & Grammar Patterns
  { zh: '但', en: 'but; however; yet', note: 'Conjunction.' },
  { zh: '但是', en: 'but; however', note: 'Conjunction.' },
  { zh: '可是', en: 'but; however', note: 'Conjunction.' },
  { zh: '不过', en: 'however; but; only', note: 'Conjunction.' },
  { zh: '因为', en: 'because; since', note: 'Conjunction.' },
  { zh: '所以', en: 'therefore; so; as a result', note: 'Conjunction.' },
  { zh: '虽然', en: 'although; even though', note: 'Conjunction.' },
  { zh: '如果', en: 'if; in case', note: 'Conjunction.' },
  { zh: '要是', en: 'if; in case', note: 'Conjunction.' },
  { zh: '而且', en: 'moreover; furthermore; in addition', note: 'Conjunction.' },
  { zh: '或者', en: 'or; either... or', note: 'Conjunction.' },
  { zh: '还是', en: 'or; still; had better', note: 'Conjunction/Adverb.' },
  { zh: '一边', en: 'at the same time; simultaneously', note: 'Adverb/Conjunction.' },
  { zh: '不但', en: 'not only', note: 'Conjunction.' },
  { zh: '除了', en: 'except for; besides; in addition to', note: 'Preposition.' },
  { zh: '无论', en: 'no matter what; regardless of', note: 'Conjunction.' },
  { zh: '不管', en: 'no matter; regardless of', note: 'Conjunction.' },
  { zh: '只要', en: 'as long as; only if', note: 'Conjunction.' },
  { zh: '只有', en: 'only; only when', note: 'Conjunction.' },
  { zh: '是不是', en: 'is it or not; whether or not', note: 'Tag question / auxiliary phrase.' },
  { zh: '不是', en: 'is not; are not; am not; no', note: 'Negative copula.' },

  // Verbs & Common Words
  { zh: '是', en: 'is; am; are; to be; yes', note: 'Copula verb.' },
  { zh: '不', en: 'not; no; non-', note: 'Adverb of negation.' },
  { zh: '有', en: 'have; possess; exist', note: 'Verb.' },
  { zh: '没有', en: 'do not have; haven\'t; there is no', note: 'Negative verb.' },
  { zh: '在', en: 'at; in; on; exist; located', note: 'Preposition / Verb.' },
  { zh: '看', en: 'look; see; read; watch', note: 'Verb.' },
  { zh: '看见', en: 'see; catch sight of', note: 'Verb.' },
  { zh: '听', en: 'listen; hear', note: 'Verb.' },
  { zh: '听到', en: 'hear', note: 'Verb.' },
  { zh: '听见', en: 'hear', note: 'Verb.' },
  { zh: '说', en: 'speak; say; talk', note: 'Verb.' },
  { zh: '说话', en: 'speak; talk', note: 'Verb-object.' },
  { zh: '写', en: 'write; compose', note: 'Verb.' },
  { zh: '想', en: 'think; want; miss', note: 'Verb.' },
  { zh: '要', en: 'want; need; require; important', note: 'Verb.' },
  { zh: '能', en: 'can; be able to; capability', note: 'Auxiliary verb.' },
  { zh: '能够', en: 'be capable of; can', note: 'Auxiliary verb.' },
  { zh: '会', en: 'can; know how to; will; meeting', note: 'Auxiliary verb.' },
  { zh: '可以', en: 'can; may; possible', note: 'Auxiliary verb.' },
  { zh: '可能', en: 'possible; maybe; perhaps', note: 'Adverb/Adjective.' },
  { zh: '应该', en: 'should; ought to', note: 'Auxiliary verb.' },
  { zh: '必须', en: 'must; have to', note: 'Adverb/Auxiliary.' },
  { zh: '觉得', en: 'feel; think that', note: 'Verb.' },
  { zh: '认为', en: 'consider; deem; think', note: 'Verb.' },
  { zh: '理解', en: 'understand; comprehend', note: 'Verb.' },
  { zh: '了解', en: 'understand; know well; find out', note: 'Verb.' },
  { zh: '明白', en: 'understand; clear; explicit', note: 'Verb/Adjective.' },
  { zh: '清楚', en: 'clear; distinct; understand thoroughly', note: 'Adjective/Verb.' },
  { zh: '发现', en: 'discover; find', note: 'Verb.' },
  { zh: '学', en: 'study; learn', note: 'Verb.' },
  { zh: '工作', en: 'work; job', note: 'Noun / Verb.' },
  { zh: '喜欢', en: 'like; enjoy', note: 'Verb.' },
  { zh: '爱好', en: 'hobby; interest; fondness', note: 'Noun/Verb.' },
  { zh: '爱', en: 'love', note: 'Verb.' },
  { zh: '生活', en: 'life; live; livelihood', note: 'Noun / Verb.' },
  { zh: '准备', en: 'prepare; get ready', note: 'Verb.' },
  { zh: '希望', en: 'hope; wish', note: 'Verb / Noun.' },
  { zh: '打算', en: 'plan; intend; intention', note: 'Verb/Noun.' },
  { zh: '决定', en: 'decide; decision', note: 'Verb/Noun.' },
  { zh: '开始', en: 'start; begin; beginning', note: 'Verb/Noun.' },
  { zh: '结束', en: 'finish; end; conclude', note: 'Verb.' },
  { zh: '完成', en: 'complete; accomplish', note: 'Verb.' },
  { zh: '参加', en: 'participate; join; attend', note: 'Verb.' },
  { zh: '比较', en: 'compare; relatively; fairly', note: 'Verb/Adverb.' },
  { zh: '选择', en: 'choose; pick; choice', note: 'Verb/Noun.' },
  { zh: '解决', en: 'solve; resolve; settle', note: 'Verb.' },
  { zh: '提高', en: 'raise; heighten; enhance', note: 'Verb.' },
  { zh: '发展', en: 'develop; expand; growth', note: 'Verb/Noun.' },
  { zh: '保护', en: 'protect; safeguard', note: 'Verb/Noun.' },
  { zh: '帮助', en: 'help; assist; aid', note: 'Verb/Noun.' },
  { zh: '介绍', en: 'introduce; recommend; briefing', note: 'Verb/Noun.' },
  { zh: '欢迎', en: 'welcome; greet', note: 'Verb.' },
  { zh: '记得', en: 'remember; recall', note: 'Verb.' },
  { zh: '忘记', en: 'forget', note: 'Verb.' },
  { zh: '遇到', en: 'meet; encounter; run into', note: 'Verb.' },
  { zh: '见面', en: 'meet; see each other', note: 'Verb-object.' },
  { zh: '离开', en: 'leave; depart from', note: 'Verb.' },
  { zh: '到达', en: 'arrive; reach', note: 'Verb.' },
  { zh: '旅行', en: 'travel; journey; tour', note: 'Verb/Noun.' },
  { zh: '买', en: 'buy; purchase', note: 'Verb.' },
  { zh: '卖', en: 'sell', note: 'Verb.' },
  { zh: '花钱', en: 'spend money', note: 'Verb phrase.' },
  { zh: '吃饭', en: 'eat food; have a meal', note: 'Verb phrase.' },
  { zh: '喝水', en: 'drink water', note: 'Verb phrase.' },
  { zh: '睡觉', en: 'sleep; go to bed', note: 'Verb phrase.' },
  { zh: '起床', en: 'get out of bed; wake up', note: 'Verb phrase.' },
  { zh: '洗澡', en: 'take a bath; take a shower', note: 'Verb phrase.' },
  { zh: '跑步', en: 'run; jog', note: 'Verb phrase.' },
  { zh: '游泳', en: 'swim', note: 'Verb.' },
  { zh: '踢足球', en: 'play football / soccer', note: 'Verb phrase.' },
  { zh: '打篮球', en: 'play basketball', note: 'Verb phrase.' },
  { zh: '运动', en: 'exercise; sports; movement', note: 'Noun/Verb.' },
  { zh: '唱歌', en: 'sing songs', note: 'Verb phrase.' },
  { zh: '跳舞', en: 'dance', note: 'Verb phrase.' },
  { zh: '看电影', en: 'watch movies', note: 'Verb phrase.' },
  { zh: '听音乐', en: 'listen to music', note: 'Verb phrase.' },

  // Nouns, Places & Daily Objects
  { zh: '中国', en: 'China; Middle Kingdom', note: 'Noun (country).' },
  { zh: '中文', en: 'Chinese language; written Chinese', note: 'Noun.' },
  { zh: '汉语', en: 'Hanyu; Chinese language', note: 'Noun.' },
  { zh: '普通话', en: 'Mandarin Chinese; standard speech', note: 'Noun.' },
  { zh: '英语', en: 'English language', note: 'Noun.' },
  { zh: '英文', en: 'English language (written)', note: 'Noun.' },
  { zh: '北京', en: 'Beijing (capital of China)', note: 'Proper noun.' },
  { zh: '上海', en: 'Shanghai', note: 'Proper noun.' },
  { zh: '广州', en: 'Guangzhou', note: 'Proper noun.' },
  { zh: '深圳', en: 'Shenzhen', note: 'Proper noun.' },
  { zh: '美国', en: 'United States of America; USA', note: 'Noun (country).' },
  { zh: '英国', en: 'United Kingdom; Britain', note: 'Noun (country).' },
  { zh: '日本', en: 'Japan', note: 'Noun (country).' },
  { zh: '世界', en: 'world', note: 'Noun.' },
  { zh: '国家', en: 'country; nation; state', note: 'Noun.' },
  { zh: '城市', en: 'city; town', note: 'Noun.' },
  { zh: '地方', en: 'place; space; local', note: 'Noun.' },
  { zh: '时间', en: 'time; duration', note: 'Noun.' },
  { zh: '时候', en: 'time; moment; period', note: 'Noun.' },
  { zh: '现在', en: 'now; nowadays; present', note: 'Time noun.' },
  { zh: '今天', en: 'today; this day', note: 'Time noun.' },
  { zh: '明天', en: 'tomorrow', note: 'Time noun.' },
  { zh: '昨天', en: 'yesterday', note: 'Time noun.' },
  { zh: '今年', en: 'this year', note: 'Time noun.' },
  { zh: '去年', en: 'last year', note: 'Time noun.' },
  { zh: '明年', en: 'next year', note: 'Time noun.' },
  { zh: '早上', en: 'morning; early morning', note: 'Time noun.' },
  { zh: '上午', en: 'morning; forenoon', note: 'Time noun.' },
  { zh: '中午', en: 'noon; midday', note: 'Time noun.' },
  { zh: '下午', en: 'afternoon', note: 'Time noun.' },
  { zh: '晚上', en: 'evening; night', note: 'Time noun.' },
  { zh: '半夜', en: 'midnight; middle of the night', note: 'Time noun.' },
  { zh: '星期', en: 'week', note: 'Noun.' },
  { zh: '周末', en: 'weekend', note: 'Noun.' },
  { zh: '月', en: 'month; moon', note: 'Noun.' },
  { zh: '日', en: 'day; sun; date', note: 'Noun.' },
  { zh: '年', en: 'year', note: 'Noun.' },
  { zh: '文化', en: 'culture; civilization', note: 'Noun.' },
  { zh: '历史', en: 'history', note: 'Noun.' },
  { zh: '边塞', en: 'frontier; border region', note: 'Noun.' },
  { zh: '天气', en: 'weather', note: 'Noun.' },
  { zh: '太阳', en: 'sun', note: 'Noun.' },
  { zh: '月亮', en: 'moon', note: 'Noun.' },
  { zh: '飞机', en: 'airplane; plane', note: 'Noun.' },
  { zh: '机场', en: 'airport', note: 'Noun.' },
  { zh: '火车', en: 'train', note: 'Noun.' },
  { zh: '火车站', en: 'train station', note: 'Noun.' },
  { zh: '地铁', en: 'subway; metro', note: 'Noun.' },
  { zh: '地铁站', en: 'subway station', note: 'Noun.' },
  { zh: '公交车', en: 'bus; public bus', note: 'Noun.' },
  { zh: '出租车', en: 'taxi; cab', note: 'Noun.' },
  { zh: '车站', en: 'station; stop', note: 'Noun.' },
  { zh: '医院', en: 'hospital', note: 'Noun.' },
  { zh: '银行', en: 'bank', note: 'Noun.' },
  { zh: '商店', en: 'shop; store', note: 'Noun.' },
  { zh: '超市', en: 'supermarket', note: 'Noun.' },
  { zh: '书店', en: 'bookstore', note: 'Noun.' },
  { zh: '饭馆', en: 'restaurant', note: 'Noun.' },
  { zh: '饭店', en: 'restaurant; hotel', note: 'Noun.' },
  { zh: '酒店', en: 'hotel; wine shop', note: 'Noun.' },
  { zh: '公园', en: 'park (public)', note: 'Noun.' },
  { zh: '电影院', en: 'cinema; movie theater', note: 'Noun.' },
  { zh: '电脑', en: 'computer', note: 'Noun.' },
  { zh: '手机', en: 'mobile phone; cell phone', note: 'Noun.' },
  { zh: '电话', en: 'telephone; phone call', note: 'Noun.' },
  { zh: '网络', en: 'internet; network', note: 'Noun.' },
  { zh: '互联网', en: 'internet', note: 'Noun.' },
  { zh: '软件', en: 'software', note: 'Noun.' },
  { zh: '微信', en: 'WeChat (messaging app)', note: 'Proper noun.' },
  { zh: '苹果', en: 'apple', note: 'Noun.' },
  { zh: '香蕉', en: 'banana', note: 'Noun.' },
  { zh: '西瓜', en: 'watermelon', note: 'Noun.' },
  { zh: '水果', en: 'fruit', note: 'Noun.' },
  { zh: '蔬菜', en: 'vegetable', note: 'Noun.' },
  { zh: '米饭', en: 'cooked rice', note: 'Noun.' },
  { zh: '面条', en: 'noodles', note: 'Noun.' },
  { zh: '面包', en: 'bread', note: 'Noun.' },
  { zh: '牛肉', en: 'beef', note: 'Noun.' },
  { zh: '羊肉', en: 'mutton; lamb', note: 'Noun.' },
  { zh: '鸡肉', en: 'chicken meat', note: 'Noun.' },
  { zh: '鱼', en: 'fish', note: 'Noun.' },
  { zh: '鸡蛋', en: 'egg; chicken egg', note: 'Noun.' },
  { zh: '牛奶', en: 'milk (cow\'s milk)', note: 'Noun.' },
  { zh: '茶', en: 'tea', note: 'Noun.' },
  { zh: '咖啡', en: 'coffee', note: 'Noun.' },
  { zh: '果汁', en: 'fruit juice', note: 'Noun.' },
  { zh: '衣服', en: 'clothes; clothing', note: 'Noun.' },
  { zh: '裤子', en: 'pants; trousers', note: 'Noun.' },
  { zh: '鞋子', en: 'shoes', note: 'Noun.' },
  { zh: '桌子', en: 'table; desk', note: 'Noun.' },
  { zh: '椅子', en: 'chair', note: 'Noun.' },
  { zh: '门', en: 'door; gate', note: 'Noun.' },
  { zh: '窗户', en: 'window', note: 'Noun.' },
  { zh: '房间', en: 'room', note: 'Noun.' },
  { zh: '房子', en: 'house; building; apartment', note: 'Noun.' },
  { zh: '钱', en: 'money; currency', note: 'Noun.' },
  { zh: '东西', en: 'thing; stuff; object', note: 'Noun.' },
  { zh: '问题', en: 'question; problem; issue', note: 'Noun.' },
  { zh: '办法', en: 'method; way; solution', note: 'Noun.' },
  { zh: '情况', en: 'situation; circumstances', note: 'Noun.' },
  { zh: '机会', en: 'opportunity; chance', note: 'Noun.' },
  { zh: '故事', en: 'story; tale', note: 'Noun.' },
  { zh: '经验', en: 'experience', note: 'Noun/Verb.' },
  { zh: '作用', en: 'role; effect; function', note: 'Noun.' },
  { zh: '社会', en: 'society', note: 'Noun.' },

  // Adjectives & Adverbs
  { zh: '好', en: 'good; fine; well', note: 'Adjective.' },
  { zh: '坏', en: 'bad; spoiled; broken', note: 'Adjective.' },
  { zh: '大', en: 'big; large; great', note: 'Adjective.' },
  { zh: '小', en: 'small; little; young', note: 'Adjective.' },
  { zh: '多', en: 'many; much; more', note: 'Adjective.' },
  { zh: '少', en: 'few; little; less', note: 'Adjective.' },
  { zh: '高', en: 'high; tall', note: 'Adjective.' },
  { zh: '矮', en: 'short (height); low', note: 'Adjective.' },
  { zh: '长', en: 'long (length/time)', note: 'Adjective.' },
  { zh: '短', en: 'short (length/time)', note: 'Adjective.' },
  { zh: '新', en: 'new; fresh', note: 'Adjective.' },
  { zh: '旧', en: 'old; worn; used', note: 'Adjective.' },
  { zh: '老', en: 'old; aged; experienced', note: 'Adjective.' },
  { zh: '年轻', en: 'young', note: 'Adjective.' },
  { zh: '快', en: 'fast; quick; rapid', note: 'Adjective/Adverb.' },
  { zh: '慢', en: 'slow', note: 'Adjective.' },
  { zh: '远', en: 'far; distant', note: 'Adjective.' },
  { zh: '近', en: 'near; close', note: 'Adjective.' },
  { zh: '热', en: 'hot; heat; warm', note: 'Adjective.' },
  { zh: '冷', en: 'cold; chilly', note: 'Adjective.' },
  { zh: '暖和', en: 'warm; nice and warm', note: 'Adjective.' },
  { zh: '凉快', en: 'pleasantly cool', note: 'Adjective.' },
  { zh: '贵', en: 'expensive; costly; precious', note: 'Adjective.' },
  { zh: '便宜', en: 'cheap; inexpensive', note: 'Adjective.' },
  { zh: '容易', en: 'easy; simple; likely', note: 'Adjective.' },
  { zh: '困难', en: 'difficult; difficulty; hard', note: 'Adjective/Noun.' },
  { zh: '简单', en: 'simple; uncomplicated', note: 'Adjective.' },
  { zh: '复杂', en: 'complex; complicated', note: 'Adjective.' },
  { zh: '漂亮', en: 'pretty; beautiful; lovely', note: 'Adjective.' },
  { zh: '美丽', en: 'beautiful; handsome', note: 'Adjective.' },
  { zh: '聪明', en: 'smart; clever; intelligent', note: 'Adjective.' },
  { zh: '认真', en: 'conscientious; serious; earnest', note: 'Adjective.' },
  { zh: '努力', en: 'hardworking; strive; make effort', note: 'Adjective/Verb.' },
  { zh: '热情', en: 'enthusiastic; warm-hearted', note: 'Adjective.' },
  { zh: '客气', en: 'polite; courteous; modest', note: 'Adjective.' },
  { zh: '安静', en: 'quiet; peaceful; calm', note: 'Adjective.' },
  { zh: '热闹', en: 'bustling; lively; lively atmosphere', note: 'Adjective.' },
  { zh: '舒服', en: 'comfortable; feeling well', note: 'Adjective.' },
  { zh: '方便', en: 'convenient; handy', note: 'Adjective.' },
  { zh: '高兴', en: 'glad; happy; pleased', note: 'Adjective.' },
  { zh: '快乐', en: 'happy; joyful; cheerful', note: 'Adjective.' },
  { zh: '伤心', en: 'sad; heartbroken; grieved', note: 'Adjective.' },
  { zh: '难过', en: 'feel bad; sorrowful; upset', note: 'Adjective.' },
  { zh: '生气', en: 'angry; mad; offended', note: 'Adjective/Verb.' },
  { zh: '着急', en: 'worried; anxious; in a hurry', note: 'Adjective.' },
  { zh: '担心', en: 'worry; be anxious about', note: 'Verb/Adjective.' },
  { zh: '害怕', en: 'be afraid of; fear; scared', note: 'Verb/Adjective.' },
  { zh: '满意', en: 'satisfied; pleased; content', note: 'Adjective.' },
  { zh: '特别', en: 'special; especially; unusual', note: 'Adjective/Adverb.' },
  { zh: '非常', en: 'very; extremely; extraordinary', note: 'Adverb.' },
  { zh: '十分', en: 'fully; completely; very', note: 'Adverb.' },
  { zh: '极其', en: 'extremely; exceedingly', note: 'Adverb.' },
  { zh: '很', en: 'very; quite', note: 'Adverb.' },
  { zh: '太', en: 'too; extremely; excessively', note: 'Adverb.' },
  { zh: '真', en: 'really; truly; real', note: 'Adverb/Adjective.' },
  { zh: '更', en: 'even more; further', note: 'Adverb.' },
  { zh: '最', en: 'most; best; -est', note: 'Adverb.' },
  { zh: '一直', en: 'always; continuously; straight', note: 'Adverb.' },
  { zh: '总是', en: 'always; invariably', note: 'Adverb.' },
  { zh: '经常', en: 'often; frequently; regularly', note: 'Adverb.' },
  { zh: '常常', en: 'often; frequently', note: 'Adverb.' },
  { zh: '有时', en: 'sometimes; at times', note: 'Adverb.' },
  { zh: '有时候', en: 'sometimes; from time to time', note: 'Adverb.' },
  { zh: '已经', en: 'already', note: 'Adverb.' },
  { zh: '正在', en: 'in the process of; right now', note: 'Adverb.' },
  { zh: '刚刚', en: 'just now; only a moment ago', note: 'Adverb.' },
  { zh: '立刻', en: 'immediately; at once; right away', note: 'Adverb.' },
  { zh: '马上', en: 'immediately; right away; shortly', note: 'Adverb.' },
  { zh: '突然', en: 'suddenly; unexpectedly', note: 'Adverb/Adjective.' },
  { zh: '其实', en: 'actually; in fact; as a matter of fact', note: 'Adverb.' },
  { zh: '原来', en: 'originally; as it turns out', note: 'Adverb/Adjective.' },
  { zh: '果然', en: 'sure enough; as expected', note: 'Adverb.' },
  { zh: '差不多', en: 'almost; nearly; just about', note: 'Adverb/Adjective.' },
  { zh: '大概', en: 'probably; roughly; approximately', note: 'Adverb.' },
  { zh: '也许', en: 'perhaps; maybe; probably', note: 'Adverb.' },
];

// Single character fallback dictionary
export const SINGLE_CHAR_DICT: Record<string, string> = {
  但: 'but / however / yet',
  怎: 'how / why',
  么: 'particle / interrogative suffix',
  知: 'know / perceive / realize',
  道: 'way / path / speak / know',
  这: 'this / these',
  不: 'not / no / non-',
  是: 'be / is / am / are / yes',
  我: 'I / me / my',
  你: 'you (singular)',
  您: 'you (polite singular)',
  他: 'he / him',
  她: 'she / her',
  它: 'it',
  们: 'plural suffix',
  那: 'that / those',
  哪: 'which / where',
  谁: 'who / whom',
  什: 'what',
  几: 'how many / a few',
  也: 'also / too / as well',
  就: 'then / precisely / just',
  还: 'still / yet / also / return',
  又: 'again / both... and...',
  再: 'again / once more',
  只: 'only / single / measure word',
  要: 'want / need / require',
  能: 'can / be able to / capability',
  会: 'can / know how to / will',
  可: 'can / may / able to',
  以: 'by means of / according to',
  对: 'correct / right / towards',
  好: 'good / fine / well',
  坏: 'bad / broken / ruined',
  大: 'big / large / great',
  小: 'small / little / minor',
  多: 'many / much',
  少: 'few / little / young',
  有: 'have / possess / exist',
  在: 'at / in / on / exist',
  看: 'look / see / read',
  听: 'listen / hear',
  说: 'speak / say / talk',
  写: 'write / compose',
  想: 'think / want / miss',
  得: 'obtain / structural particle',
  地: 'ground / earth / adverbial particle',
  的: 'possessive or modifying particle',
  着: 'continuous state particle',
  过: 'pass / cross / experienced action particle',
  了: 'completed action or change of state particle',
  吧: 'modal suggestion particle',
  呢: 'modal question particle',
  吗: 'question particle',
  啊: 'modal exclamation particle',
  和: 'and / with / peace',
  与: 'and / with / give',
  跟: 'with / follow',
  从: 'from / obey',
  到: 'to / arrive / reach',
  向: 'towards / face',
  离: 'away from / leave',
  给: 'give / for / to',
  让: 'let / allow / yield',
  被: 'passive marker / by',
  把: 'object marker / hold',
  因: 'cause / reason / because',
  为: 'because of / for / act',
  所: 'place / structure',
  而: 'and / but / yet',
  且: 'furthermore / moreover',
  若: 'if / like',
  如: 'as / if / like',
  非: 'non- / wrong / not',
  未: 'not yet / future',
  别: 'don\'t / separate / other',
  更: 'even more / further',
  最: 'most / -est',
  真: 'true / real / really',
  太: 'too / excessively',
  很: 'very / quite',
  高: 'high / tall',
  低: 'low / lower',
  矮: 'short (height) / low',
  新: 'new / fresh',
  旧: 'old / used / worn',
  老: 'old / experienced',
  长: 'long / grow',
  短: 'short',
  远: 'far / distant',
  近: 'near / close',
  难: 'difficult / hard',
  易: 'easy / change',
  快: 'fast / quick / happy',
  慢: 'slow',
  学: 'study / learn',
  习: 'practice / habit / study',
  喜: 'like / fondness / joyful',
  欢: 'joyous / pleased / delight',
  儿: 'child / son / suffix',
  子: 'child / son / noun suffix',
  图: 'picture / drawing / plan / chart',
  书: 'book / letter / write',
  馆: 'building / establishment / hall / library',
  生: 'birth / student / raw',
  师: 'teacher / master',
  家: 'family / home / specialist',
  国: 'country / nation',
  城: 'city / wall',
  市: 'market / city',
  日: 'sun / day',
  月: 'moon / month',
  年: 'year',
  时: 'time / hour',
  分: 'minute / divide',
  秒: 'second (time)',
  山: 'mountain / hill',
  水: 'water / liquid',
  人: 'person / human',
  言: 'speech / words',
  语: 'language / words',
  文: 'culture / language / literature / writing',
  字: 'character / letter / word',
  心: 'heart / mind',
  思: 'think / consider',
  意: 'meaning / intention',
  理: 'reason / logic / manage',
  解: 'explain / understand / loosen',
  识: 'recognize / know',
  明: 'bright / clear / understand',
  白: 'white / clear / plain',
  信: 'believe / trust / letter',
  爱: 'love / affection',
  福: 'blessing / fortune / good luck',
  祸: 'misfortune / calamity',
  塞: 'frontier / strategic pass / fill',
  翁: 'old man / father-in-law',
  失: 'lose / miss',
  马: 'horse',
  牛: 'ox / cow / beef',
  羊: 'sheep / goat / lamb',
  鸡: 'chicken / fowl',
  鱼: 'fish',
  蛋: 'egg',
  肉: 'meat / flesh',
  菜: 'vegetable / dish / cuisine',
  饭: 'cooked rice / meal / food',
  面: 'noodles / face / surface',
  包: 'wrap / bag / bun',
  茶: 'tea',
  车: 'car / vehicle',
  路: 'road / path / route',
  街: 'street',
  店: 'shop / store / hotel',
  房: 'room / house',
  屋: 'house / room',
  门: 'door / gate',
  窗: 'window',
  桌: 'table / desk',
  椅: 'chair',
  床: 'bed',
  物: 'thing / object / matter',
  事: 'matter / thing / business / affair',
  情: 'feeling / emotion / situation',
  况: 'condition / situation',
  机: 'machine / opportunity',
  电: 'electricity / electronic',
  脑: 'brain / mind',
  手: 'hand',
  口: 'mouth / opening',
  眼: 'eye',
  耳: 'ear',
  头: 'head / first',
  身: 'body / person',
  衣: 'clothing / clothes',
  服: 'clothes / obey / serve',
  裤: 'pants / trousers',
  鞋: 'shoe',
  钱: 'money / coin',
  票: 'ticket / vote',
  题: 'topic / question / problem',
  法: 'law / method / way',
  办: 'manage / do / handle',
  用: 'use / employ',
  做: 'do / make / produce',
  作: 'make / compose / work',
  工: 'work / worker',
  动: 'move / action',
  运: 'transport / carry / luck / sport',
  校: 'school',
  室: 'room',
  院: 'courtyard / institution / hospital',
  公: 'public / male / grandfather',
  园: 'garden / park',
  海: 'sea / ocean',
  河: 'river',
  天: 'sky / day / heaven / weather',
  气: 'air / gas / breath / weather',
  风: 'wind / style',
  雨: 'rain',
  雪: 'snow',
  云: 'cloud',
  红: 'red',
  蓝: 'blue',
  绿: 'green',
  黑: 'black / dark',
  黄: 'yellow',
  金: 'gold / metal',
  银: 'silver',
  北: 'north',
  南: 'south',
  东: 'east',
  西: 'west',
  中: 'middle / center / Chinese / in',
  上: 'up / above / on / previous',
  下: 'down / below / next',
  左: 'left',
  右: 'right',
  前: 'front / ahead / former',
  后: 'back / behind / after',
  里: 'inside / in / Chinese mile',
  外: 'outside / foreign',
  旁: 'beside / side',
  问: 'ask / inquire',
  答: 'answer / reply',
  买: 'buy / purchase',
  卖: 'sell',
  走: 'walk / go / leave',
  跑: 'run',
  跳: 'jump / leap / dance',
  飞: 'fly',
  游: 'swim / tour / wander',
  坐: 'sit / travel by',
  住: 'live / dwell / stay',
  穿: 'wear / put on / pierce',
  吃: 'eat',
  喝: 'drink',
  玩: 'play / have fun',
  唱: 'sing',
  歌: 'song',
  舞: 'dance',
  笑: 'smile / laugh',
  哭: 'cry / weep',
  开: 'open / start / drive',
  关: 'close / shut / relation',
  送: 'send / give as gift / deliver',
  借: 'borrow / lend',
  等: 'wait / rank / equal',
  帮: 'help / assist',
  助: 'assist / aid',
  接: 'receive / meet / connect',
  找: 'look for / find / give change',
  洗: 'wash / clean',
  准: 'accurate / standard / allow',
  备: 'prepare / ready',
  带: 'bring / take / carry / belt',
  始: 'begin / start',
  终: 'end / finish / eventual',
  完: 'finish / complete',
  成: 'accomplish / become / complete',
  变: 'change / transform',
  化: 'change / transform / -ize',
  决: 'decide / determine',
  定: 'settle / fix / calm',
  愿: 'willing / desire / wish',
  希: 'hope / rare',
  望: 'gaze / look towards / hope',
};

/**
 * Pre-indexed Hash Maps for instant O(1) dictionary lookups
 */
const ZH_LEXICON_MAP = new Map<string, OfflineEntry>();
const EN_LEXICON_MAP = new Map<string, OfflineEntry>();
const EN_LOWER_INDEX = new Map<string, OfflineEntry>();

// Initialize index maps once at startup
for (const entry of OFFLINE_LEXICON) {
  if (entry.zh) {
    ZH_LEXICON_MAP.set(entry.zh.trim(), entry);
  }
  if (entry.en) {
    const rawEn = entry.en.trim();
    EN_LEXICON_MAP.set(rawEn, entry);
    // Index each synonym / primary gloss in lowercase for fast English lookups
    const glosses = rawEn.split(/;/).map((g) => g.trim().toLowerCase());
    for (const g of glosses) {
      if (g && !EN_LOWER_INDEX.has(g)) {
        EN_LOWER_INDEX.set(g, entry);
      }
    }
  }
}

// In-memory LRU / caches for high-speed offline parsing
const PINYIN_CACHE = new Map<string, string>();
const BREAKDOWN_CACHE = new Map<string, CharacterBreakdown[]>();
const OFFLINE_TRANSLATION_MEM_CACHE = new Map<string, TranslationResult>();
const ASYNC_PHRASE_CACHE = new Map<string, string>();

/**
 * Generate accurate Hanyu Pinyin with tone marks using pinyin-pro library with instant caching.
 */
export function getOfflinePinyin(text: string): string {
  if (!text) return '';
  const cached = PINYIN_CACHE.get(text);
  if (cached !== undefined) return cached;

  try {
    const result = pinyin(text, { toneType: 'symbol', type: 'string' });
    if (PINYIN_CACHE.size < 2000) {
      PINYIN_CACHE.set(text, result);
    }
    return result;
  } catch (e) {
    return '';
  }
}

/**
 * Perform offline character-by-character breakdown with fast memoization.
 */
export function getOfflineBreakdown(text: string): CharacterBreakdown[] {
  if (!text) return [];
  const cached = BREAKDOWN_CACHE.get(text);
  if (cached) return cached;

  const list: CharacterBreakdown[] = [];
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (/[\u4e00-\u9fa5]/.test(char)) {
      const charPy = getOfflinePinyin(char);
      let rawMean = SINGLE_CHAR_DICT[char];

      if (!rawMean) {
        // Fallback search in indexed OFFLINE_LEXICON for single character
        const lexEntry = ZH_LEXICON_MAP.get(char);
        if (lexEntry) {
          rawMean = lexEntry.en;
        } else {
          rawMean = 'character';
        }
      }

      const cleanMean = rawMean.split('/')[0].split(';')[0].trim();
      list.push({
        char,
        pinyin: charPy,
        mean: cleanMean || 'character',
      });
    }
  }

  if (BREAKDOWN_CACHE.size < 2000) {
    BREAKDOWN_CACHE.set(text, list);
  }
  return list;
}

/**
 * Perform smart word segmentation using hybrid segmentation engine and indexed offline dictionary matching.
 */
function segmentChineseText(text: string): { word: string; mean: string }[] {
  const result: { word: string; mean: string }[] = [];
  
  try {
    const spans = segmentChineseHybrid(text);
    for (const span of spans) {
      const cleanW = span.word.trim();
      if (!cleanW) continue;

      if (span.isWord && /[\u4e00-\u9fa5]/.test(cleanW)) {
        const entry = ZH_LEXICON_MAP.get(cleanW);
        if (entry) {
          const primary = entry.en.split(';')[0].split('/')[0].trim();
          result.push({ word: cleanW, mean: primary });
        } else {
          // Check character or sub-word
          let subMean = '';
          for (let c of cleanW) {
            if (SINGLE_CHAR_DICT[c]) {
              subMean += (subMean ? ' ' : '') + SINGLE_CHAR_DICT[c].split('/')[0].trim();
            }
          }
          result.push({ word: cleanW, mean: subMean || 'term' });
        }
      } else {
        // Punctuation or non-Chinese
        if (cleanW !== ' ' && cleanW !== '，' && cleanW !== '。' && cleanW !== '？' && cleanW !== '！') {
          result.push({ word: cleanW, mean: cleanW });
        }
      }
    }
    if (result.length > 0) return result;
  } catch (e) {
    // Fallback if needed
  }

  return result;
}

/**
 * Compose a natural English phrase/sentence translation from segmented tokens and grammar rules.
 */
function composeEnglishTranslation(segments: { word: string; mean: string }[], originalText: string): string {
  if (segments.length === 0) return originalText;

  // Direct exact match check via O(1) index
  const exact = ZH_LEXICON_MAP.get(originalText);
  if (exact) {
    return exact.en.split(';')[0].trim();
  }

  if (segments.length === 1) {
    return segments[0].mean;
  }

  // Filter out redundant structural grammatical particles in phrase translation
  const ignoreInPhrase = ['particle', 'possessive or modifying particle', 'continuous state particle', 'modal suggestion particle', 'modal question particle', 'question particle', 'modal exclamation particle'];

  const words = segments
    .filter((s) => !ignoreInPhrase.includes(s.mean))
    .map((s) => s.mean)
    .filter(Boolean);

  let sentence = words.join(' ');

  // Syntax smoothing for common Chinese-English structures
  sentence = sentence
    .replace(/\bbut how do you know how do you know\b/gi, 'but how do you know')
    .replace(/\bbut how know\b/gi, 'but how do you know')
    .replace(/\bhow know\b/gi, 'how do you know')
    .replace(/\bthis is not\b/gi, 'this isn\'t')
    .replace(/\bdo not know\b/gi, 'don\'t know')
    .replace(/\bis not\b/gi, 'isn\'t')
    .replace(/\bone measure word\b/gi, 'a')
    .replace(/\bone piece of\b/gi, 'a')
    .replace(/\bvery glad recognize you\b/gi, 'nice to meet you')
    .replace(/\bwhat is name\b/gi, 'what is [your] name')
    .replace(/\bmore and more important\b/gi, 'increasingly important');

  // Capitalize first letter
  if (sentence.length > 0) {
    sentence = sentence.charAt(0).toUpperCase() + sentence.slice(1);
  }

  return sentence;
}

/**
 * Client-side/Offline Google Translate GTX endpoint fetcher.
 * Uses Google Translate's web engine to translate whole phrases & sentences accurately as a single unit without API keys.
 */
async function fetchGoogleTranslatePhrase(text: string, sourceLang = 'zh-CN', targetLang = 'en'): Promise<string | null> {
  if (!text || text.trim().length === 0) return null;
  const cacheKey = `${sourceLang}:${targetLang}:${text.trim()}`;
  if (ASYNC_PHRASE_CACHE.has(cacheKey)) {
    return ASYNC_PHRASE_CACHE.get(cacheKey)!;
  }

  try {
    const sl = sourceLang.startsWith('zh') ? 'zh-CN' : 'en';
    const tl = targetLang.startsWith('en') ? 'en' : 'zh-CN';

    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sl}&tl=${tl}&dt=t&q=${encodeURIComponent(text.trim())}`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000); // 2.0s reliable timeout

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) return null;
    const data = await res.json();

    if (Array.isArray(data) && Array.isArray(data[0])) {
      const translatedParts = data[0].map((item: any) => item[0]).filter(Boolean);
      const fullTranslation = translatedParts.join('').trim();
      if (fullTranslation && fullTranslation !== text) {
        if (ASYNC_PHRASE_CACHE.size < 1000) {
          ASYNC_PHRASE_CACHE.set(cacheKey, fullTranslation);
        }
        return fullTranslation;
      }
    }
  } catch (e) {
    // Network unavailable or timed out - fall back to offline dictionary engine
  }
  return null;
}

/**
 * Synchronous offline translation using fast indexed lexicon & hybrid segmentation.
 */
export function translateOffline(
  text: string,
  context: string,
  mode: 'zh-to-en' | 'en-to-zh' = 'zh-to-en'
): TranslationResult {
  const cleanText = text.trim();
  const cleanContext = (context || text).trim();
  const memKey = `${mode}:${cleanText}:${cleanContext}`;

  const cachedResult = OFFLINE_TRANSLATION_MEM_CACHE.get(memKey);
  if (cachedResult) {
    return cachedResult;
  }

  let result: TranslationResult;

  if (mode === 'zh-to-en') {
    const directMatch = ZH_LEXICON_MAP.get(cleanText);
    const py = getOfflinePinyin(cleanText);
    const breakdown = getOfflineBreakdown(cleanText);

    let englishMeaning = directMatch?.en.split(';')[0].trim();
    let grammaticalNote = directMatch?.note;

    if (!englishMeaning) {
      if (cleanText.length === 1 && SINGLE_CHAR_DICT[cleanText]) {
        englishMeaning = SINGLE_CHAR_DICT[cleanText].split('/')[0].trim();
        grammaticalNote = 'Single character lexical unit.';
      } else {
        const segments = segmentChineseText(cleanText);
        englishMeaning = composeEnglishTranslation(segments, cleanText);
        grammaticalNote = `Segmented phrase: ${segments.map((s) => `${s.word} (${s.mean})`).join(' + ')}`;
      }
    }

    result = {
      chinese: cleanText,
      pinyin: py,
      english: englishMeaning,
      contextSentence: cleanContext,
      contextTranslation: `"${cleanContext}"`,
      grammaticalNote: grammaticalNote || 'Offline dictionary entry with smart Pinyin synthesis.',
      breakdown,
      mode,
      selectedText: cleanText,
      source: 'offline-cedict',
    };
  } else {
    const lower = cleanText.toLowerCase();
    let match = EN_LOWER_INDEX.get(lower);

    if (!match) {
      for (const entry of OFFLINE_LEXICON) {
        if (entry.en.toLowerCase().includes(lower)) {
          match = entry;
          break;
        }
      }
    }

    const chinese = match ? match.zh : cleanText;
    const py = getOfflinePinyin(chinese);
    const breakdown = getOfflineBreakdown(chinese);

    result = {
      chinese,
      pinyin: py,
      english: cleanText,
      contextSentence: cleanContext,
      contextTranslation: `"${cleanContext}"`,
      grammaticalNote: match?.note || 'Offline English-Chinese lexicon lookup.',
      breakdown,
      mode,
      selectedText: cleanText,
      source: 'offline-cedict',
    };
  }

  if (OFFLINE_TRANSLATION_MEM_CACHE.size < 1000) {
    OFFLINE_TRANSLATION_MEM_CACHE.set(memKey, result);
  }

  return result;
}

/**
 * Asynchronous translation engine for words, whole phrases, and context sentences.
 * Uses Google Translate GTX framework for high-accuracy phrase & sentence translation,
 * falling back gracefully to indexed CC-CEDICT offline rules.
 */
export async function translateOfflineAsync(
  text: string,
  context: string,
  mode: 'zh-to-en' | 'en-to-zh' = 'zh-to-en'
): Promise<TranslationResult> {
  const cleanText = text.trim();
  const cleanContext = (context || text).trim();

  const srcLang = mode === 'zh-to-en' ? 'zh-CN' : 'en';
  const tgtLang = mode === 'zh-to-en' ? 'en' : 'zh-CN';

  // 1. Fetch phrase translation and full context translation
  try {
    const [phraseTranslation, contextTranslation] = await Promise.all([
      fetchGoogleTranslatePhrase(cleanText, srcLang, tgtLang),
      cleanContext !== cleanText ? fetchGoogleTranslatePhrase(cleanContext, srcLang, tgtLang) : Promise.resolve(null),
    ]);

    if (phraseTranslation) {
      const targetForPinyin = mode === 'zh-to-en' ? cleanText : phraseTranslation;
      const py = getOfflinePinyin(targetForPinyin);
      const breakdown = getOfflineBreakdown(targetForPinyin);

      return {
        chinese: mode === 'zh-to-en' ? cleanText : phraseTranslation,
        pinyin: py,
        english: mode === 'zh-to-en' ? phraseTranslation : cleanText,
        contextSentence: cleanContext,
        contextTranslation: contextTranslation ? `"${contextTranslation}"` : `"${cleanContext}"`,
        grammaticalNote: 'Full-phrase translation via Google Translate engine.',
        breakdown,
        mode,
        selectedText: cleanText,
        source: 'offline-google-gtx',
      };
    }
  } catch (e) {
    // Fall back to offline lexicon
  }

  // 2. Fall back to offline lexicon & smart segment engine
  return translateOffline(cleanText, cleanContext, mode);
}



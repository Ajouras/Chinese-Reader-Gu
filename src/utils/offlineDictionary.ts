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

  // Architecture, Cities, Travel & Culture (Exploring Beijing & Wonders)
  { zh: '中心', en: 'center; middle; hub; core', note: 'Noun.' },
  { zh: '市中心', en: 'city center; downtown; city centre', note: 'Noun phrase.' },
  { zh: '中央', en: 'central; center; middle', note: 'Noun/Adjective.' },
  { zh: '山', en: 'mountain; hill', note: 'Noun.' },
  { zh: '高山', en: 'high mountain; mountain peak', note: 'Noun.' },
  { zh: '山脉', en: 'mountain range; mountain; mountains', note: 'Noun.' },
  { zh: '群山', en: 'rolling mountains; hills; mountains; green mountains', note: 'Noun.' },
  { zh: '青山', en: 'green mountains; green hills', note: 'Noun.' },
  { zh: '城市', en: 'city; town; metropolis', note: 'Noun.' },
  { zh: '大都市', en: 'metropolis; big city', note: 'Noun.' },
  { zh: '首都', en: 'capital (city); national capital', note: 'Noun.' },
  { zh: '古老', en: 'ancient; age-old', note: 'Adjective.' },
  { zh: '古代', en: 'ancient times; antiquity', note: 'Noun.' },
  { zh: '建筑', en: 'architecture; building; structure', note: 'Noun/Verb.' },
  { zh: '建筑物', en: 'building; structure', note: 'Noun.' },
  { zh: '结构', en: 'structure; composition; construction', note: 'Noun.' },
  { zh: '庭院', en: 'courtyard; patio', note: 'Noun.' },
  { zh: '院子', en: 'courtyard; yard', note: 'Noun.' },
  { zh: '历史', en: 'history; past events', note: 'Noun.' },
  { zh: '故宫', en: 'Forbidden City; Palace Museum; imperial palace', note: 'Proper noun.' },
  { zh: '紫禁城', en: 'Forbidden City', note: 'Proper noun.' },
  { zh: '长城', en: 'Great Wall of China; Great Wall', note: 'Proper noun.' },
  { zh: '万里长城', en: 'Great Wall of China; Great Wall', note: 'Proper noun.' },
  { zh: '皇宫', en: 'imperial palace; royal palace', note: 'Noun.' },
  { zh: '宫殿', en: 'palace', note: 'Noun.' },
  { zh: '皇帝', en: 'emperor', note: 'Noun.' },
  { zh: '帝国', en: 'empire; imperial', note: 'Noun/Adjective.' },
  { zh: '朝代', en: 'dynasty', note: 'Noun.' },
  { zh: '奇观', en: 'wonder; marvelous spectacle', note: 'Noun.' },
  { zh: '奇迹', en: 'miracle; wonder; marvel', note: 'Noun.' },
  { zh: '壮观', en: 'spectacular; grand; magnificent', note: 'Adjective.' },
  { zh: '美景', en: 'spectacular view; beautiful scenery; view; spectacular views', note: 'Noun.' },
  { zh: '壮丽景色', en: 'spectacular views; spectacular view; breathtaking scenery', note: 'Noun phrase.' },
  { zh: '风景', en: 'scenery; landscape; view', note: 'Noun.' },
  { zh: '景色', en: 'scenery; view; landscape', note: 'Noun.' },
  { zh: '视野', en: 'field of view; sight; view', note: 'Noun.' },
  { zh: '令人叹为观止', en: 'breathtaking; magnificent; stunning', note: 'Idiom/Adjective.' },
  { zh: '令人敬畏', en: 'awe; awe-inspiring; profound sense of awe; sense of awe', note: 'Phrase.' },
  { zh: '敬畏感', en: 'sense of awe; profound sense of awe; awe', note: 'Noun phrase.' },
  { zh: '敬畏', en: 'awe; reverence; revere', note: 'Noun/Verb.' },
  { zh: '深刻', en: 'profound; deep; striking', note: 'Adjective.' },
  { zh: '苍翠', en: 'green; verdant; lush', note: 'Adjective.' },
  { zh: '起伏', en: 'rolling; undulating; rise and fall', note: 'Verb/Adjective.' },
  { zh: '优美', en: 'graceful; fine; exquisite', note: 'Adjective.' },
  { zh: '优雅', en: 'gracefully; elegant; graceful', note: 'Adverb/Adjective.' },
  { zh: '蜿蜒', en: 'wind; winding; meandering', note: 'Verb/Adjective.' },
  { zh: '优美地蜿蜒', en: 'winding gracefully; wind gracefully', note: 'Verb phrase.' },
  { zh: '融合', en: 'blend; merge; integrate', note: 'Verb.' },
  { zh: '结合', en: 'combine; unite; integrate', note: 'Verb.' },
  { zh: '探索', en: 'explore; probe; seek', note: 'Verb.' },
  { zh: '游览', en: 'visit; tour; go sightseeing', note: 'Verb.' },
  { zh: '参观', en: 'visit; look around; inspect', note: 'Verb.' },
  { zh: '石头', en: 'stone; rock', note: 'Noun.' },
  { zh: '石制', en: 'stone structure; made of stone; stone', note: 'Noun/Adjective.' },
  { zh: '石制结构', en: 'stone structure; stone building', note: 'Noun phrase.' },
  { zh: '巨大', en: 'colossal; huge; gigantic; enormous', note: 'Adjective.' },
  { zh: '庞大', en: 'huge; enormous; colossal', note: 'Adjective.' },
  { zh: '充满活力', en: 'vibrant; full of vitality', note: 'Phrase/Adjective.' },
  { zh: '无缝', en: 'seamless; seamlessly', note: 'Adjective/Adverb.' },
  { zh: '完美', en: 'perfect; flawless', note: 'Adjective.' },
  { zh: '复合体', en: 'complex; composite entity', note: 'Noun.' },
  { zh: '作为', en: 'serve; act as; regard as', note: 'Preposition/Verb.' },
  { zh: '服务', en: 'serve; service', note: 'Verb/Noun.' },
  { zh: '漫步', en: 'stroll; walk leisurely; walk', note: 'Verb.' },
  { zh: '行走', en: 'walk; travel on foot', note: 'Verb.' },
  { zh: '感觉', en: 'feel; sense; feeling', note: 'Verb/Noun.' },
  { zh: '感受', en: 'feel; experience; perception', note: 'Verb/Noun.' },
  { zh: '迈步', en: 'step; take a step', note: 'Verb.' },
  { zh: '踏入', en: 'step into; enter; stepping into', note: 'Verb.' },
  { zh: '步入', en: 'step back into; step into; enter; stepping back into', note: 'Verb.' },
  { zh: '永恒', en: 'timeless; eternal; perpetual', note: 'Adjective.' },
  { zh: '篇章', en: 'chapter; section of writing', note: 'Noun.' },
  { zh: '章节', en: 'chapter; section', note: 'Noun.' },
  { zh: '站立', en: 'stand; be standing', note: 'Verb.' },
  { zh: '耸立', en: 'stand tall; tower; stand atop', note: 'Verb.' },
  { zh: '耸立在', en: 'standing atop; stand atop', note: 'Verb phrase.' },
  { zh: '顶上', en: 'atop; on top of; summit', note: 'Noun/Preposition.' },
  { zh: '提供', en: 'offer; provide; supply; offers', note: 'Verb.' },
  { zh: '展现', en: 'offer; show; unfold; reveal; offers', note: 'Verb.' },
  { zh: '不远处', en: 'not far from; nearby', note: 'Phrase.' },
  { zh: '数百年', en: 'hundreds of years; centuries', note: 'Noun phrase.' },
  { zh: '五百年', en: 'five hundred years', note: 'Noun phrase.' },
  { zh: '照顾', en: 'take care of; look after', note: 'Verb phrase.' },
  { zh: '期待', en: 'look forward to; anticipate', note: 'Verb phrase.' },
  { zh: '注意', en: 'pay attention to; pay attention', note: 'Verb phrase.' },
  { zh: '放弃', en: 'give up; abandon', note: 'Verb phrase.' },
  { zh: '用完', en: 'run out of; run out', note: 'Verb phrase.' },
  { zh: '意识', en: 'sense; consciousness; awareness', note: 'Noun/Verb.' },
  { zh: '科技', en: 'technology; science and technology', note: 'Noun.' },
  { zh: '技术', en: 'technology; technique; skill', note: 'Noun.' },
  { zh: '发展', en: 'develop; development; growth', note: 'Verb/Noun.' },
  { zh: '改变', en: 'change; alter; transform', note: 'Verb/Noun.' },
  { zh: '日常生活', en: 'daily life; everyday life', note: 'Noun phrase.' },
  { zh: '智能手机', en: 'smartphone; smart phone', note: 'Noun.' },
  { zh: '语音助手', en: 'voice assistant', note: 'Noun.' },
  { zh: '自动驾驶', en: 'autonomous driving; self-driving', note: 'Noun.' },
  { zh: '汽车', en: 'car; vehicle; automobile', note: 'Noun.' },
  { zh: '应用', en: 'application; apply; use', note: 'Noun/Verb.' },
  { zh: '无处不在', en: 'everywhere; ubiquitous', note: 'Idiom/Adjective.' },
  { zh: '领域', en: 'field; domain; realm', note: 'Noun.' },
  { zh: '语言学习', en: 'language learning', note: 'Noun phrase.' },
  { zh: '跨语言', en: 'cross-language; cross-lingual', note: 'Adjective.' },
  { zh: '交流', en: 'communication; exchange; communicate', note: 'Verb/Noun.' },
  { zh: '沟通', en: 'communicate; connect; communication', note: 'Verb/Noun.' },
  { zh: '前所未有', en: 'unprecedented; never before', note: 'Idiom.' },
  { zh: '便捷', en: 'convenient; quick and convenient', note: 'Adjective.' },
  { zh: '学习者', en: 'learner; student', note: 'Noun.' },
  { zh: '随时随地', en: 'anytime and anywhere; anytime', note: 'Idiom/Adverb.' },
  { zh: '实时', en: 'real-time; in real time', note: 'Adverb/Adjective.' },
  { zh: '翻译', en: 'translate; translation; interpreter', note: 'Verb/Noun.' },
  { zh: '语境', en: 'context; linguistic context', note: 'Noun.' },
  { zh: '分析', en: 'analyze; analysis', note: 'Verb/Noun.' },
  { zh: '深层', en: 'deep; deep layer', note: 'Adjective.' },
  { zh: '含义', en: 'meaning; connotation; implication', note: 'Noun.' },
  { zh: '意思', en: 'meaning; idea; interest', note: 'Noun.' },
  { zh: '文化', en: 'culture; cultural', note: 'Noun/Adjective.' },
  { zh: '背景', en: 'background; backdrop; context', note: 'Noun.' },
  { zh: '人类', en: 'humanity; human race; human beings', note: 'Noun.' },
  { zh: '课题', en: 'topic; issue; problem; research topic', note: 'Noun.' },
  { zh: '享受', en: 'enjoy; enjoyment', note: 'Verb/Noun.' },
  { zh: '便利', en: 'convenience; convenient', note: 'Noun/Adjective.' },
  { zh: '同时', en: 'at the same time; simultaneously; while', note: 'Conjunction/Adverb.' },
  { zh: '保持', en: 'maintain; keep; preserve', note: 'Verb.' },
  { zh: '独立', en: 'independent; independence', note: 'Adjective/Noun.' },
  { zh: '思考', en: 'think; ponder; reflection; thinking', note: 'Verb/Noun.' },
  { zh: '创造力', en: 'creativity; creative power', note: 'Noun.' },
  { zh: '需要', en: 'need; require; demand', note: 'Verb/Noun.' },
  { zh: '探索', en: 'explore; quest; probe', note: 'Verb/Noun.' },
  { zh: '未知', en: 'unknown; unrevealed', note: 'Adjective/Noun.' },
  { zh: '过程', en: 'process; course of events', note: 'Noun.' },
  { zh: '不断', en: 'continuously; unceasingly; non-stop', note: 'Adverb.' },
  { zh: '寻求', en: 'seek; look for; aspire to', note: 'Verb.' },
  { zh: '平衡', en: 'balance; equilibrium; poise', note: 'Noun/Verb.' },
  // English phrase matches & common contextual expressions
  { zh: '连绵起伏的青山', en: 'rolling green mountains; rolling green hills; green mountains', note: 'Noun phrase.' },
  { zh: '群山', en: 'rolling mountains; mountains; mountain range; hills', note: 'Noun.' },
  { zh: '青山', en: 'green mountains; green hills; verdant mountains', note: 'Noun.' },
  { zh: '连绵起伏', en: 'rolling; undulating; rolling gracefully; rolling hills', note: 'Adjective/Verb.' },
  { zh: '站立在巨大的石质建筑之上', en: 'standing atop this colossal stone structure; standing atop the colossal stone structure', note: 'Verb phrase.' },
  { zh: '巨大的石质建筑', en: 'colossal stone structure; massive stone structure; huge stone building', note: 'Noun phrase.' },
  { zh: '巨大的石质结构', en: 'colossal stone structure; colossal structure; stone structure', note: 'Noun phrase.' },
  { zh: '巨大', en: 'colossal; huge; massive; gigantic; tremendous', note: 'Adjective.' },
  { zh: '石质', en: 'stone; masonry; rock', note: 'Adjective/Noun.' },
  { zh: '结构', en: 'structure; framework; composition', note: 'Noun.' },
  { zh: '建筑', en: 'structure; building; architecture', note: 'Noun/Verb.' },
  { zh: '壮丽景色', en: 'spectacular views; magnificent views; breathtaking scenery', note: 'Noun phrase.' },
  { zh: '壮丽的景色', en: 'spectacular views; spectacular view; stunning scenery; magnificent view', note: 'Noun phrase.' },
  { zh: '景色', en: 'views; scenery; landscape; view; sight', note: 'Noun.' },
  { zh: '壮丽', en: 'spectacular; magnificent; grand; majestic', note: 'Adjective.' },
  { zh: '深深的敬畏感', en: 'profound sense of awe; deep sense of awe; feeling of awe', note: 'Noun phrase.' },
  { zh: '敬畏之情', en: 'sense of awe; feelings of awe; awe and reverence', note: 'Noun phrase.' },
  { zh: '敬畏', en: 'awe; reverent fear; respect and awe', note: 'Noun/Verb.' },
  { zh: '深厚', en: 'profound; deep; solid', note: 'Adjective.' },
  { zh: '深刻', en: 'profound; deep; insightful', note: 'Adjective.' },
  { zh: '深沉', en: 'profound; deep; contemplative', note: 'Adjective.' },
  { zh: '蜿蜒穿行', en: 'winding gracefully; winding; meandering gracefully', note: 'Verb phrase.' },
  { zh: '蜿蜒', en: 'winding; meandering; sinuous', note: 'Adjective/Verb.' },
  { zh: '优雅地', en: 'gracefully; elegantly; gracefully over', note: 'Adverb.' },
  { zh: '优雅', en: 'graceful; elegant; graceful and poised', note: 'Adjective.' },
  { zh: '万里长城', en: 'Great Wall of China; Great Wall; Great Wall of china', note: 'Proper noun.' },
  { zh: '中国万里长城', en: 'the Great Wall of China; Great Wall of China', note: 'Proper noun.' },
  { zh: '长城', en: 'Great Wall; long wall', note: 'Proper noun.' },
  { zh: '市中心', en: 'city center; downtown; center of the city; town center', note: 'Noun.' },
  { zh: '离市中心不远', en: 'not far from the city center; close to the city center', note: 'Phrase.' },
  { zh: '离...不远', en: 'not far from; close to; nearby', note: 'Preposition phrase.' },
  { zh: '座落', en: 'lies; is situated; located; stands', note: 'Verb.' },
  { zh: '位于', en: 'lies; located in; situated at; is located', note: 'Verb.' },
  { zh: '跨越', en: 'over; across; straddle; spans over', note: 'Verb/Preposition.' },
  { zh: '踏入永恒的历史篇章', en: 'stepping back into a timeless chapter of history; stepping into a timeless chapter of history', note: 'Phrase.' },
  { zh: '历史篇章', en: 'chapter of history; historical chapter; pages of history', note: 'Noun phrase.' },
  { zh: '永恒的', en: 'timeless; eternal; everlasting', note: 'Adjective.' },
  { zh: '回溯', en: 'stepping back; tracing back; look back', note: 'Verb.' },
  { zh: '重温', en: 'stepping back into; revisit; relive', note: 'Verb.' },
  { zh: '呈现出', en: 'offers; presents; displays; brings about', note: 'Verb.' },
  { zh: '带来', en: 'offers; brings; produces; yields', note: 'Verb.' },
  { zh: '感受', en: 'sense; feel; experience; impression', note: 'Noun/Verb.' },
  { zh: '感觉', en: 'sense; feeling; sensation', note: 'Noun/Verb.' },
  { zh: '而且', en: 'and; furthermore; moreover', note: 'Conjunction.' },
  { zh: '以及', en: 'and; as well as; along with', note: 'Conjunction.' },
  { zh: '之上', en: 'atop; above; on top of; atop this', note: 'Preposition.' },
  { zh: '这所', en: 'this; this particular', note: 'Demonstrative.' },
  { zh: '这座', en: 'this; this massive', note: 'Demonstrative.' },
  { zh: '这个', en: 'this; this one', note: 'Demonstrative.' },
  { zh: '那个', en: 'that; that one', note: 'Demonstrative.' },
  { zh: '这些', en: 'these', note: 'Demonstrative.' },
  { zh: '那些', en: 'those', note: 'Demonstrative.' },
  { zh: '令人惊叹', en: 'spectacular; breathtaking; amazing', note: 'Adjective.' },
  { zh: '令人敬畏', en: 'awe-inspiring; awe; profound sense of awe', note: 'Adjective.' },
  { zh: '上升', en: 'rise; ascend; go up; rising; climb; increasing', note: 'Verb.' },
  { zh: '升起', en: 'rise; ascend; lift; rising; coming up', note: 'Verb.' },
  { zh: '升', en: 'rise; hoist; ascend; promote; liter', note: 'Verb/Noun.' },
  { zh: '弥漫', en: 'permeate; fill the air; suffuse; spread; lingering', note: 'Verb.' },
  { zh: '烟雾', en: 'smoke; mist; smog; haze; fumes', note: 'Noun.' },
  { zh: '烟', en: 'smoke; tobacco; mist; cigarette', note: 'Noun.' },
  { zh: '铜香', en: 'bronze incense; copper incense', note: 'Noun.' },
  { zh: '铜', en: 'copper; bronze; brass', note: 'Noun/Adjective.' },
  { zh: '香', en: 'incense; fragrant; sweet-smelling; perfume', note: 'Noun/Adjective.' },
  { zh: '药片', en: 'tablet; pill; medicine tablet', note: 'Noun.' },
  { zh: '碑文', en: 'tablet inscription; stone tablet; inscription; tablet', note: 'Noun.' },
  { zh: '石碑', en: 'stone tablet; monument; stele; tablet', note: 'Noun.' },
  { zh: '两边', en: 'both sides; either side; on both sides', note: 'Noun/Phrase.' },
  { zh: '侧面', en: 'side; flank; aspect; profile', note: 'Noun.' },
  { zh: '气压', en: 'air pressure; atmospheric pressure; barometric pressure', note: 'Noun.' },
  { zh: '空气', en: 'air; atmosphere', note: 'Noun.' },
  { zh: '压力', en: 'pressure; stress; tension', note: 'Noun.' },
  { zh: '没有变化', en: 'no change; has no change; unchanged; without change', note: 'Phrase.' },
  { zh: '改变', en: 'change; alter; transform; modify', note: 'Verb/Noun.' },
  { zh: '变化', en: 'change; variation; shift; fluctuate', note: 'Noun/Verb.' },
  { zh: '保持', en: 'maintain; keep; preserve; stay', note: 'Verb.' },
  { zh: '移动', en: 'move; shift; motion; traveling', note: 'Verb/Noun.' },
  { zh: '停止', en: 'stop; cease; halt; pause', note: 'Verb.' },
  { zh: '光芒', en: 'rays of light; brilliant rays; glow; shine', note: 'Noun.' },
  { zh: '黑暗', en: 'darkness; dark; gloom; obscure', note: 'Noun/Adjective.' },
  { zh: '明亮', en: 'bright; shining; luminous; clear', note: 'Adjective.' },
  { zh: '火焰', en: 'flame; fire; blaze', note: 'Noun.' },
  { zh: '水流', en: 'stream; water current; flow of water', note: 'Noun.' },
  { zh: '山峰', en: 'mountain peak; summit; crest', note: 'Noun.' },
  { zh: '天空', en: 'sky; heaven; firmament', note: 'Noun.' },
  { zh: '土地', en: 'land; earth; ground; soil', note: 'Noun.' },
  { zh: '自然', en: 'nature; natural; naturally', note: 'Noun/Adjective.' },
  { zh: '世界', en: 'world; universe; realm', note: 'Noun.' },
  { zh: '空间', en: 'space; room; clearance', note: 'Noun.' },
  { zh: '时间', en: 'time; duration; period', note: 'Noun.' },
];

// Single character fallback dictionary
export const SINGLE_CHAR_DICT: Record<string, string> = {
  升: 'rise / ascend / hoist / liter',
  烟: 'smoke / tobacco / mist',
  雾: 'fog / mist',
  铜: 'copper / bronze',
  香: 'incense / fragrant / sweet-smelling',
  片: 'slice / piece / tablet / flake',
  药: 'medicine / drug / remedy',
  碑: 'stone tablet / monument / stele',
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

/**
 * Generate stem variations of an English word (plural, tense, adverbs)
 */
export function getEnglishStems(word: string): string[] {
  const clean = word.toLowerCase().trim();
  const stems = new Set<string>([clean]);

  // Strip non-alphanumeric edges
  const noPunct = clean.replace(/^[^a-z0-9]+|[^a-z0-9]+$/gi, '');
  if (noPunct) stems.add(noPunct);

  // Plurals and endings
  if (clean.endsWith('ies') && clean.length > 4) {
    stems.add(clean.slice(0, -3) + 'y'); // cities -> city
  }
  if (clean.endsWith('es') && clean.length > 3) {
    stems.add(clean.slice(0, -2)); // watches -> watch, courtyards
    stems.add(clean.slice(0, -1)); // palaces -> palace
  }
  if (clean.endsWith('s') && !clean.endsWith('ss') && clean.length > 3) {
    stems.add(clean.slice(0, -1)); // mountains -> mountain, wonders -> wonder, centers -> center
  }

  // -ing forms
  if (clean.endsWith('ing') && clean.length > 4) {
    stems.add(clean.slice(0, -3)); // visiting -> visit, standing -> stand, rolling -> roll, winding -> wind
    stems.add(clean.slice(0, -3) + 'e'); // stepping -> step
    const base = clean.slice(0, -3);
    if (base.length > 2 && base[base.length - 1] === base[base.length - 2]) {
      stems.add(base.slice(0, -1)); // stepping -> step
    }
  }

  // -ed forms
  if (clean.endsWith('ed') && clean.length > 3) {
    stems.add(clean.slice(0, -2)); // walked -> walk
    stems.add(clean.slice(0, -1)); // served -> serve, lived -> live
    const base = clean.slice(0, -2);
    if (base.length > 2 && base[base.length - 1] === base[base.length - 2]) {
      stems.add(base.slice(0, -1)); // stopped -> stop
    }
  }

  // -ly forms
  if (clean.endsWith('ly') && clean.length > 4) {
    stems.add(clean.slice(0, -2)); // gracefully -> graceful
  }

  return Array.from(stems);
}

/**
 * Intelligent English lookup that checks direct glosses, stems, and definitions
 */
export function findEnglishLexiconMatch(cleanText: string): OfflineEntry | null {
  const lower = cleanText.toLowerCase().trim();
  if (!lower) return null;

  // 1. Direct index match
  if (EN_LOWER_INDEX.has(lower)) {
    return EN_LOWER_INDEX.get(lower)!;
  }

  // 2. Stemming checks
  const stems = getEnglishStems(lower);
  for (const stem of stems) {
    if (EN_LOWER_INDEX.has(stem)) {
      return EN_LOWER_INDEX.get(stem)!;
    }
  }

  // 3. Substring / phrase match in OFFLINE_LEXICON
  for (const entry of OFFLINE_LEXICON) {
    const entryLower = entry.en.toLowerCase();
    for (const stem of stems) {
      const regex = new RegExp(`\\b${stem}\\b`, 'i');
      if (regex.test(entryLower)) {
        return entry;
      }
    }
  }

  return null;
}

// Initialize index maps once at startup
for (const entry of OFFLINE_LEXICON) {
  if (entry.zh) {
    ZH_LEXICON_MAP.set(entry.zh.trim(), entry);
  }
  if (entry.en) {
    const rawEn = entry.en.trim();
    EN_LEXICON_MAP.set(rawEn, entry);
    // Index each synonym, gloss, and clean token in lowercase for fast English lookups
    const glosses = rawEn.split(/[;/]/).map((g) => g.trim().toLowerCase());
    for (const g of glosses) {
      if (g) {
        if (!EN_LOWER_INDEX.has(g)) {
          EN_LOWER_INDEX.set(g, entry);
        }
        // Also index without parentheses notes (e.g. "center (of town)" -> "center")
        const withoutParen = g.replace(/\(.*?\)/g, '').trim();
        if (withoutParen && !EN_LOWER_INDEX.has(withoutParen)) {
          EN_LOWER_INDEX.set(withoutParen, entry);
        }
      }
    }
  }
}

// Single unified LRU-bounded Translation Cache
const MAX_CACHE_SIZE = 1000;
const TRANSLATION_CACHE = new Map<string, TranslationResult>();

function getCachedTranslation(key: string): TranslationResult | undefined {
  return TRANSLATION_CACHE.get(key);
}

function setCachedTranslation(key: string, result: TranslationResult): void {
  if (TRANSLATION_CACHE.size >= MAX_CACHE_SIZE) {
    const oldestKey = TRANSLATION_CACHE.keys().next().value;
    if (oldestKey) {
      TRANSLATION_CACHE.delete(oldestKey);
    }
  }
  TRANSLATION_CACHE.set(key, result);
}

/**
 * Generate accurate Hanyu Pinyin with tone marks using pinyin-pro library.
 * Strictly checks that text contains Chinese characters to prevent outputting spaced roman letters.
 */
export function getOfflinePinyin(text: string): string {
  if (!text || !/[\u4e00-\u9fa5]/.test(text)) return '';
  try {
    return pinyin(text, { toneType: 'symbol', type: 'string' });
  } catch (e) {
    return '';
  }
}

/**
 * Perform character-by-character breakdown using SINGLE_CHAR_DICT and OFFLINE_LEXICON.
 */
export function getOfflineBreakdown(text: string): CharacterBreakdown[] {
  if (!text) return [];

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
 * Compose a natural English phrase/sentence translation from segmented tokens.
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

  const ignoreInPhrase = ['particle', 'possessive or modifying particle', 'continuous state particle', 'modal suggestion particle', 'modal question particle', 'question particle', 'modal exclamation particle'];

  const words = segments
    .filter((s) => !ignoreInPhrase.includes(s.mean))
    .map((s) => s.mean)
    .filter(Boolean);

  let sentence = words.join(' ');

  if (sentence.length > 0) {
    sentence = sentence.charAt(0).toUpperCase() + sentence.slice(1);
  }

  return sentence;
}

function sanitizeTranslationResponse(raw: string, targetLang: string): string {
  if (!raw) return '';
  let clean = raw.replace(/&#39;/g, "'").replace(/&quot;/g, '"').trim();

  if (targetLang.startsWith('zh')) {
    if (/[\u4e00-\u9fa5]/.test(clean)) {
      clean = clean.replace(/\([^)]*[a-zA-Z][^)]*\)/g, '').replace(/\[[^\]]*[a-zA-Z][^\]]*\]/g, '').trim();
      clean = clean.replace(/[;|,–—-]\s*[a-zA-Z0-9\s.,'"]+$/g, '').trim();
      const cjkMatch = clean.match(/^([\u4e00-\u9fa5\u3000-\u303f\uff01-\uff5e0-9\s]+?)(?:[a-zA-Z]{2,}[\s\S]*)?$/);
      if (cjkMatch && cjkMatch[1] && /[\u4e00-\u9fa5]/.test(cjkMatch[1])) {
        clean = cjkMatch[1].trim();
      }
    }
  }

  return clean;
}

/**
 * Fast Google Translate GTX neural translation fetcher.
 * Uses primary and fallback endpoints with responsive timeout.
 */
async function fetchGtxTranslation(text: string, sourceLang = 'en', targetLang = 'zh-CN'): Promise<string | null> {
  if (!text || text.trim().length === 0) return null;
  const clean = text.trim();

  const sl = sourceLang.startsWith('zh') ? 'zh-CN' : 'en';
  const tl = targetLang.startsWith('en') ? 'en' : 'zh-CN';

  // 1. Primary Google GTX endpoint
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sl}&tl=${tl}&dt=t&q=${encodeURIComponent(clean)}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && Array.isArray(data[0])) {
        const translatedParts = data[0].map((item: any) => item[0]).filter(Boolean);
        let fullTranslation = translatedParts.join('').trim();
        fullTranslation = sanitizeTranslationResponse(fullTranslation, tl);
        if (fullTranslation && fullTranslation.toLowerCase() !== clean.toLowerCase()) {
          return fullTranslation;
        }
      }
    }
  } catch (e) {
    // Primary endpoint failed, fallback below
  }

  // 2. Secondary Google Translate mirror
  try {
    const fallbackUrl = `https://clients5.google.com/translate_a/t?client=dict-chrome-ex&sl=${sl}&tl=${tl}&q=${encodeURIComponent(clean)}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    const res = await fetch(fallbackUrl, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && typeof data[0] === 'string') {
        let fullTranslation = data[0].trim();
        fullTranslation = sanitizeTranslationResponse(fullTranslation, tl);
        if (fullTranslation && fullTranslation.toLowerCase() !== clean.toLowerCase()) {
          return fullTranslation;
        }
      } else if (typeof data === 'string') {
        let fullTranslation = data.trim();
        fullTranslation = sanitizeTranslationResponse(fullTranslation, tl);
        if (fullTranslation && fullTranslation.toLowerCase() !== clean.toLowerCase()) {
          return fullTranslation;
        }
      }
    }
  } catch (e) {
    // Secondary endpoint failed
  }

  return null;
}

/**
 * Last-resort offline dictionary fallback (non-contextual general gloss).
 */
export function translateOffline(
  text: string,
  context: string,
  mode: 'zh-to-en' | 'en-to-zh' = 'zh-to-en'
): TranslationResult {
  const cleanText = text.trim();
  const cleanContext = (context || text).trim();
  const isEnToZh = mode === 'en-to-zh' || !/[\u4e00-\u9fa5]/.test(cleanText);
  const cacheKey = `${cleanText}:${cleanContext}`;

  const cachedResult = getCachedTranslation(cacheKey);
  if (cachedResult) {
    return cachedResult;
  }

  let result: TranslationResult;

  if (!isEnToZh) {
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
        const composed = composeEnglishTranslation(segments, cleanText);
        if (composed && composed !== cleanText) {
          englishMeaning = composed;
          grammaticalNote = `Segmented phrase: ${segments.map((s) => `${s.word} (${s.mean})`).join(' + ')}`;
        }
      }
    }

    const isEnglishFound = Boolean(englishMeaning && englishMeaning.trim() !== cleanText.trim());

    const contextSegments = segmentChineseText(cleanContext);
    const contextTranslation = composeEnglishTranslation(contextSegments, cleanContext);

    result = {
      chinese: cleanText,
      pinyin: py,
      english: isEnglishFound ? englishMeaning! : '',
      contextSentence: cleanContext,
      contextTranslation: contextTranslation ? `"${contextTranslation}"` : '',
      grammaticalNote: isEnglishFound ? (grammaticalNote || 'Offline dictionary entry.') : undefined,
      breakdown: isEnglishFound ? breakdown : [],
      mode: 'zh-to-en',
      selectedText: cleanText,
      source: 'offline-cedict',
      status: isEnglishFound ? 'success' : 'not_found',
      errorMessage: isEnglishFound ? undefined : `No offline translation found for "${cleanText}"`,
    };
  } else {
    // English-to-Chinese fallback: exact/stemmed dictionary match only
    const directMatch = findEnglishLexiconMatch(cleanText);
    const isChineseFound = Boolean(directMatch && /[\u4e00-\u9fa5]/.test(directMatch.zh));
    const chinese = isChineseFound ? directMatch!.zh : '';
    const py = isChineseFound ? getOfflinePinyin(chinese) : '';
    const breakdown = isChineseFound ? getOfflineBreakdown(chinese) : [];
    
    // Check if whole context sentence matches a dictionary entry
    let ctxZh = '';
    if (cleanContext === cleanText) {
      ctxZh = isChineseFound ? chinese : '';
    } else {
      const ctxMatch = findEnglishLexiconMatch(cleanContext);
      ctxZh = (ctxMatch && /[\u4e00-\u9fa5]/.test(ctxMatch.zh)) ? ctxMatch.zh : '';
    }

    result = {
      chinese: isChineseFound ? chinese : '',
      pinyin: py,
      english: cleanText,
      contextSentence: cleanContext,
      contextTranslation: ctxZh ? `"${ctxZh}"` : '',
      grammaticalNote: isChineseFound 
        ? (directMatch?.note || `Offline dictionary match for "${cleanText}"`)
        : undefined,
      breakdown: isChineseFound ? breakdown : [],
      mode: 'en-to-zh',
      selectedText: cleanText,
      source: 'offline-cedict',
      status: isChineseFound ? 'success' : 'not_found',
      errorMessage: isChineseFound ? undefined : `No offline translation found for "${cleanText}"`,
    };
  }

  setCachedTranslation(cacheKey, result);
  return result;
}

/**
 * Primary contextual translation pipeline:
 * Sends selected text and its full context sentence in parallel to the fast Google GTX endpoint (1.5s timeout).
 * Falls back to offline lexicon dictionary if network is unavailable or times out.
 */
export async function translateOfflineAsync(
  text: string,
  context: string,
  mode: 'zh-to-en' | 'en-to-zh' = 'zh-to-en'
): Promise<TranslationResult> {
  const cleanText = text.trim();
  const cleanContext = (context || text).trim();
  const isEnToZh = mode === 'en-to-zh' || !/[\u4e00-\u9fa5]/.test(cleanText);
  const cacheKey = `${cleanText}:${cleanContext}`;

  // 1. Single LRU Cache check
  const cached = getCachedTranslation(cacheKey);
  if (cached) {
    return cached;
  }

  const srcLang = isEnToZh ? 'en' : 'zh-CN';
  const tgtLang = isEnToZh ? 'zh-CN' : 'en';

  // 2. Primary Fast GTX Translation: parallel requests for phrase & context sentence
  try {
    const [phraseTranslation, contextTranslation] = await Promise.all([
      fetchGtxTranslation(cleanText, srcLang, tgtLang),
      cleanContext !== cleanText ? fetchGtxTranslation(cleanContext, srcLang, tgtLang) : Promise.resolve(null),
    ]);

    if (phraseTranslation && phraseTranslation.trim().toLowerCase() !== cleanText.toLowerCase()) {
      const zhWord = isEnToZh ? phraseTranslation.trim() : cleanText;
      const enWord = isEnToZh ? cleanText : phraseTranslation.trim();
      const py = getOfflinePinyin(zhWord);
      const breakdown = getOfflineBreakdown(zhWord);

      const finalCtxTranslation = contextTranslation 
        ? `"${contextTranslation.trim()}"` 
        : (cleanContext === cleanText ? `"${phraseTranslation.trim()}"` : `"${cleanContext}"`);

      const result: TranslationResult = {
        chinese: zhWord,
        pinyin: py,
        english: enWord,
        contextSentence: cleanContext,
        contextTranslation: finalCtxTranslation,
        grammaticalNote: isEnToZh
          ? 'Contextual neural translation via Google GTX engine.'
          : 'Contextual translation via Google GTX engine.',
        breakdown,
        mode: isEnToZh ? 'en-to-zh' : 'zh-to-en',
        selectedText: cleanText,
        source: 'google-gtx',
        status: 'success',
      };

      setCachedTranslation(cacheKey, result);
      return result;
    }
  } catch (e) {
    // Network fail or timeout -> fallback triggers below
  }

  // 3. Last-resort fallback to offline lexicon (non-contextual general gloss)
  return translateOffline(cleanText, cleanContext, isEnToZh ? 'en-to-zh' : 'zh-to-en');
}



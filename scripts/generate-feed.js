/**
 * 每日精选内容生成脚本
 * 用法: node scripts/generate-feed.js
 *
 * 根据当前日期生成 autofeed/podcast.json、express.json、books.json
 * 使用日期种子做伪随机，每天内容不同但可复现
 *
 * 可扩展：接入 AI API（OpenAI/DeepSeek）生成更高质量内容
 */

const fs = require('fs');
const path = require('path');

const TODAY = new Date();
const DATE_STR = TODAY.toISOString().split('T')[0]; // YYYY-MM-DD
const TIME_STR = TODAY.toISOString().replace('Z', '+08:00').slice(0, 19) + '+08:00';

// 简单伪随机（同一天同一输出）
function seededRandom(seed) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xFFFFFFFF;
    return (s >>> 0) / 0xFFFFFFFF;
  };
}

// 用日期字符串生成种子
function dateSeed() {
  return DATE_STR.split('-').reduce((a, n) => a + parseInt(n) * 100, 0);
}

const rng = seededRandom(dateSeed());

// 从数组中随机取 n 个
function pick(arr, n) {
  const shuffled = [...arr].sort(() => rng() - 0.5);
  return shuffled.slice(0, n);
}

// 基于书名生成豆瓣搜索链接，避免硬编码 subject ID 失效导致链接错位
function bookSearchUrl(title) {
  return 'https://book.douban.com/subject_search?search_text=' + encodeURIComponent((title || '').trim());
}

// ============ 播客内容池 ============
const PODCAST_POOL = [
  // 经济类
  { title: "十分吸引 Vol.76 分裂与抢钱：K型分化下的全球资产定价", author: "石磊 / 敏姐", platform: "小宇宙", tag: "经济", reason: "138分钟深圳线下演讲，讲透K型分化下钱被谁抢走。", url: "https://www.xiaoyuzhoufm.com/podcast/66b4ec5e29b084247093375f" },
  { title: "知本论 vol.163 摩根·豪泽尔：怎样花钱买到快乐？", author: "中信书院 · 冰洁 × 携隐Melody", platform: "小宇宙", tag: "经济", reason: "把《金钱心理学》聊成可用的花钱观。", url: "https://www.xiaoyuzhoufm.com/episode/6a589897a4972c496dfcc5d8" },
  { title: "跨国串门儿计划 #656 All-In：芯片股暴跌与追加保证金", author: "一凯（All-In Podcast 中文译制）", platform: "小宇宙", tag: "经济", reason: "长期看对为何仍会先被杠杆杀死。", url: "" },
  { title: "无人之境 Vol.103 通缩年代的资产配置实操手册", author: "@冷眼观经济", platform: "小宇宙", tag: "经济", reason: "用大白话讲清利率、通胀与个人现金流的关系。", url: "" },
  { title: "商业就是这样 Q3特辑：消费降级还是消费分级？", author: "@第一财经", platform: "小宇宙", tag: "经济", reason: "一份结构清晰的季度消费地图。", url: "" },
  // 毛选/成长类
  { title: "大佳的成长磁场 Vol.53 毛选笔记⑤：领导力的技术与艺术", author: "大佳", platform: "Apple Podcasts", tag: "毛选", reason: "毛选笔记收官，把出主意、用干部拆成领导力方法。", url: "https://podcasts.apple.com/cn/podcast/id1829445873" },
  { title: "尽兴小灶 EP09 克服迷茫焦虑：成事指南《毛泽东选集》", author: "汪汪 & 小棠", platform: "喜马拉雅", tag: "毛选", reason: "用实践论、矛盾论拆解人生低谷。", url: "https://m.ximalaya.com/sound/950230607" },
  { title: "《毛选》里的成长智慧：知行合一方法论", author: "蒲谦谦", platform: "蜻蜓FM", tag: "毛选", reason: "把经典篇章变成对抗内耗的行动方法论。", url: "http://www.qtfm.cn/channels/530173" },
  { title: "毛选里的方法论 第8讲：实践论如何指导日常决策", author: "@红色读书会", platform: "喜马拉雅", tag: "毛选", reason: "从认识-实践-再认识的循环中找到行动力。", url: "" },
  // 女性成长
  { title: "岩中花述 S9E3 鲁豫对话蔡皋：种花种草种春天", author: "陈鲁豫 / GIADA · JustPod", platform: "小宇宙", tag: "女性成长", reason: "八旬绘本画家的晚熟人生样本。", url: "https://www.xiaoyuzhoufm.com/episode/6a1eb4cc7444b57222322dcf" },
  { title: "見她見己｜女性成长与职场重塑指南", author: "苗子_Nmnx", platform: "小宇宙", tag: "女性成长", reason: "HR出身主播拆掉30+职场内耗执念。", url: "https://www.xiaoyuzhoufm.com/podcast/69bb66f9e6504fc1cc7d59d2" },
  { title: "women elevated EP25：女性如何建立个人品牌", author: "@她力量", platform: "小宇宙", tag: "女性成长", reason: "访谈多位行业女性，聊影响力建设。", url: "" },
];

// ============ 练嘴素材池 ============
const EXPRESS_POOL = [
  {
    title: "日常·夸人要夸到具体的点上",
    scenario: "日常",
    text: "夸人别只会说「你好厉害」，那句话轻飘飘的，落不到心里去。\n你得夸到具体的点上——「你刚才那个转场，接得特别顺，我完全没察觉」。\n你看，越具体，对方越知道你是真的在看他。",
    tip: "练习提示：「你好厉害」故意放平放轻，具体那句加重音。"
  },
  {
    title: "日常·朋友难过时先接情绪再讲道理",
    scenario: "日常",
    text: "朋友跟你倒苦水的时候，千万别急着说「你应该怎么怎么样」。他不是来找方案的，他是来找人的。\n你就说一句：「这事换我也得难受一阵。」停一下，再问：「你现在最想干嘛？」\n很多时候，人要的不是答案，是有个人肯陪他把情绪走完。",
    tip: "说完后停满一秒，别抢话——停顿本身就是安慰。"
  },
  {
    title: "职场·结论先行，三十秒说清一件事",
    scenario: "职场",
    text: "领导时间紧，你就按这个顺序说。\n先给结论——「项目进度正常，能按时上线」；再给支撑——「核心指标完成一百二，比上周高十五个点」；最后给动作——「剩下的收尾我盯着，有变化随时同步您」。\n三句话：结论、数据、承诺，说完就停。",
    tip: "三段之间各停一拍；「说完就停」是真的要停住。"
  },
  {
    title: "职场·被质疑时的缓冲三句",
    scenario: "职场",
    text: "被点名、被质疑，第一反应千万别是解释。你越急着辩，别人越觉得你扛不住事。\n记住三句缓冲：「情况我先核对一下，马上反馈您。」「这个问题我清楚了，我来处理。」「确实我这边考虑不周，我马上补救。」\n先接事，再接责，最后才说原因。",
    tip: "三句话语速一致、音量放平，不带情绪——越稳越有说服力。"
  },
  {
    title: "社交·自我介绍别报简历",
    scenario: "社交",
    text: "别人问你是做什么的，别张口就是「我在某某公司做某某岗位」。那是简历，不是介绍。\n试试这样说：「我帮XX行业的人解决XX问题。」比如：「我帮电商卖家把退货率从8%降到2%。」一句话，对方立刻知道你是干什么的、你能给他带来什么价值。\n自我介绍的本质不是展示你有多牛，而是告诉对方你可以跟他产生什么连接。",
    tip: "说完后停一秒，给对方反应和追问的空间。"
  },
  {
    title: "日常·把一件小事讲出画面感",
    scenario: "日常",
    text: "我们楼下那家早餐铺，老板娘六点就开门。锅盖一掀，白气「呼」地冲上去，把招牌都糊住了。\n她手快，一勺豆浆、两根油条，边装边喊号，从不出错。有回我赶时间没带钱，她直接把袋子塞我手里，说「明天给」。\n就这么一句话，我在这条街上住了五年。",
    tip: "拟声词「呼」要放出声来，最后一句放慢收住。"
  },
  {
    title: "职场·接任务别只说「好的收到」",
    scenario: "职场",
    text: "领导派活，你回一句「好的收到」，听着乖，其实空。\n换成这样说：「收到。我理解是要出一版初稿，重点放在数据这块，对吧？今天下班前给您，中间有卡点我第一时间同步。」\n一句话三件事——确认需求、明确时间、承诺反馈。靠谱这两个字，就是这么一次次攒出来的。",
    tip: "「对吧」尾音往上扬是真在问；时间承诺往下压是真在定。"
  },
  {
    title: "社交·被问私事时轻巧挡回去",
    scenario: "社交",
    text: "亲戚问你「工资多少啊」「啥时候结婚啊」，别硬顶，也别憋屈。\n你就笑着接：「够花，饿不着，您别操心。」再顺手把话头递回去：「倒是您那手红烧肉，什么时候教教我？」\n你看——不接招、不冷脸，还给了台阶。挡话的最高境界，是把气氛挡得比原来还热闹。",
    tip: "全程带着笑意读，「够花／饿不着」三个短促停顿。"
  },
  {
    title: "日常·道歉别说「但是」",
    scenario: "日常",
    text: "「对不起，但是我……」——这句话一出来，前面的「对不起」就全废了。\n真道歉只有两步：承认具体错误 + 说补救措施。「昨天开会迟到了，耽误大家时间了，下次我会提前十分钟到。」完了。没有「但是」「因为」「其实」。\n解释是给自己听的，对方只关心两点：你知不知道错了 + 你准备怎么改。",
    tip: "练习：把所有「但是」换成「接下来我会……」。"
  },
  {
    title: "职场·求人办事先说对方的好处",
    scenario: "职场",
    text: "跨部门找人帮忙，别一上来就「我需要你做什么」。\n换个开头：「哥，这事儿要是这周走完，你们那边下季度的指标能提前松一大截。」把对方的好处先摆出来，再说你要什么。\n求人不是求情，是让对方看见——这事对他也划算。",
    tip: "「对他也划算」这句加重放慢，它是整段话的落点。"
  },
];

// ============ 好书推荐池 ============
const BOOKS_POOL = [
  { title: "何以中国", author: "葛剑雄", source: "历史经典", cat: "历史", reason: "追问中华文明源头，重塑文化认同。", url: "https://book.douban.com/subject/35438195/" },
  { title: "康熙的红票", author: "孙立天", source: "新锐历史", cat: "历史", reason: "以小见大，揭开清代中西交流真相。", url: "https://book.douban.com/subject/36654020/" },
  { title: "围城", author: "钱钟书", source: "文学经典", cat: "文学", reason: "精准道破婚姻与人生的围城困境。", url: "https://book.douban.com/subject/1006145/" },
  { title: "活着", author: "余华", source: "文学经典", cat: "文学", reason: "在苦难中读懂活着本身的意义。", url: "https://book.douban.com/subject/4912068/" },
  { title: "长安的荔枝", author: "马伯庸", source: "历史小说", cat: "文学", reason: "历史小人物的社畜求生实录。", url: "https://book.douban.com/subject/35714957/" },
  { title: "认知觉醒", author: "周岭", source: "成长励志", cat: "成长", reason: "破解行动力困局，实现自我进化。", url: "https://book.douban.com/subject/34362190/" },
  { title: "你当像鸟飞往你的山", author: "塔拉·韦斯特弗", source: "成长励志", cat: "成长", reason: "教育如何重塑自我与命运。", url: "https://book.douban.com/subject/33444401/" },
  { title: "我决定要活得很久", author: "陈鲁豫", source: "女性成长", cat: "成长", reason: "34位女性的生命韧性与勇气。", url: "https://book.douban.com/subject/36399468/" },
  { title: "金钱心理学", author: "摩根·豪泽尔", source: "财商思维", cat: "成长", reason: "关于财富、贪婪与幸福的日常智慧。", url: "https://book.douban.com/subject/35718049/" },
  { title: "置身事内", author: "兰小欢", source: "经济科普", cat: "经济", reason: "读懂中国政府与经济发展的底层逻辑。", url: "https://book.douban.com/subject/35904616/" },
  { title: "明朝那些事儿(壹)", author: "当年明月", source: "通俗历史", cat: "历史", reason: "让历史变得比小说还好看的开篇之作。", url: "https://book.douban.com/subject/3684248/" },
  { title: "被讨厌的勇气", author: "岸见一郎 / 古贺史健", source: "心理成长", cat: "成长", reason: "阿德勒心理学入门，自由就是被别人讨厌。", url: "https://book.douban.com/subject/26685160/" },
];

// ============ 生成逻辑 ============
function generatePodcast() {
  const items = pick(PODCAST_POOL, 6);
  return { topic: "podcast", date: DATE_STR, updatedAt: TIME_STR, items };
}

function generateExpress() {
  const items = pick(EXPRESS_POOL, 5);
  return { topic: "express", date: DATE_STR, updatedAt: TIME_STR, items };
}

function generateBooks() {
  const items = pick(BOOKS_POOL, 5).map(b => ({ ...b, url: bookSearchUrl(b.title) }));
  return { topic: "books", date: DATE_STR, updatedAt: TIME_STR, items };
}

// ============ 主程序 ============
const autofeedDir = path.join(__dirname, '..', 'autofeed');

if (!fs.existsSync(autofeedDir)) {
  fs.mkdirSync(autofeedDir, { recursive: true });
}

const outputs = [
  ['podcast.json', generatePodcast()],
  ['express.json', generateExpress()],
  ['books.json', generateBooks()],
];

for (const [filename, data] of outputs) {
  const filepath = path.join(autofeedDir, filename);
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2) + '\n', 'utf-8');
  console.log(`✅ Generated ${filename} (${data.items.length} items, date=${DATE_STR})`);
}

console.log(`\n📡 每日精选已更新至 ${DATE_STR}`);

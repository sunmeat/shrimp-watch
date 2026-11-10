import { useMemo, useState } from 'react';
import { Copy, Share2, Sparkles, RotateCcw, Fish, Waves, PartyPopper } from 'lucide-react';

const SHRIMPS = [
  { name: "Тигрова креветка", emoji: '🐅', mood: "Королівська впевненість", description: "Ти не підвищуєш голосу. Ти просто з'являєшся, і навіть холодильник розуміє, хто тут головний.", advice: "Не поступайся місцем в холодильнику і не погоджуйся на підозрілі знижки." },
  { name: "Північна креветка", emoji: '❄️', mood: "Спокій та розрахунок", description: "Поки решта метушиться, ти вже порівняв ціни, перевірив склад та зберіг чек.", advice: "Зберігай холодну голову. Гарячими нехай будуть лише креветки на сковорідці." },
  { name: "Креветка-богомол", emoji: '🥊', mood: "Енергія великого плану", description: "Маленьке завдання? Чи не сьогодні. У тебе енергія людини, яка прийшла на Привоз за кропом і повернулася з бізнес-планом.", advice: "Спрямуй енергію на одну важливу справу. Не треба перемагати весь світ до обіду." },
  { name: "Креветка-пістолет", emoji: '🔫', mood: "Потужне клацання характеру", description: "Ти вмієш поставити крапку одним влучним зауваженням. Чемно, коротко, і всі зрозуміли.", advice: "Спочатку видихни, потім клацай. Не кожна суперечка варта твого внутрішнього моря." },
  { name: "Прозора креветка", emoji: '💎', mood: "Тонке чуття", description: "Ти бачиш деталі, що інші пропускають. Особливо дрібний шрифт біля слова \"акція\".", advice: "Довіряй інтуїції, але перевіряй цінник. Навіть якщо продавець усміхається дуже переконливо." },
  { name: "Креветка-чистильник", emoji: '🧹', mood: "Порядок та турбота", description: "Ти вмієш навести лад у хаосі та допомогти іншим без зайвої вистави.", advice: "Подбай сьогодні і про себе. Навіть найкориснішій креветці потрібна перерва." },
  { name: "Королівська креветка", emoji: '👑', mood: "Жити гарно", description: "У тебе смак, гідність та талант знаходити маленьку розкіш навіть у звичайному вівторку.", advice: "Дозволь собі щось приємне, але спочатку порівняй ціну. Корона короною, а бюджет любить повагу." },
];

const QUESTIONS = [
  { question: "На Привозі побачив підозрілу знижку. Твої дії?", answers: [{ text: "Зрівняю ціну та склад", points: 1 }, { text: "Запитаю тітку Соню", points: 2 }, { text: "Вже кличу таксі з холодильником", points: 3 }] },
  { question: "Як ти вирішуєш складні завдання?", answers: [{ text: "Спокійно, за пунктами", points: 1 }, { text: "З гумором та розмовою", points: 2 }, { text: "З ефектним клацанням", points: 3 }] },
  { question: "Ідеальний вечір?", answers: [{ text: "Тиша, чай та порядок", points: 1 }, { text: "Друзі, море та смачна їжа", points: 2 }, { text: "Музика, танці та королівський розмах", points: 3 }] },
  { question: "Що важливіше у креветковому житті?", answers: [{ text: "Надійність та здоровий глузд", points: 1 }, { text: "Доброе серце та хороша компанія", points: 2 }, { text: "Характер та ефектна поява", points: 3 }] },
];

const PREDICTIONS = [
  "Сьогодні море обставин хвилюватиметься, а ти тримайся впевнено. І перевір кишені: удача любить дрібницю.",
  "Тетя Соня ухвалила: не бери на себе чужу драму. У тебе своїх справ повно, і всі вони варті гарного фіналу.",
  "Можлива зустріч з гарною новиною та підозріло приємною ціною. Перевіряй обидві, золотце.",
  "Сьогодні твій головний суперскіл - вчасно сказати \"таки ні\". Користуйся ним без почуття провини.",
  "Зірки радять поїсти нормально, випити води та не відповідати на повідомлення, написані на голодний шлунок.",
  "На горизонті маячить невеличка радість. Не пройди повз, бо задивився на цінник.",
  "День сприятливий для сміливих рішень, але не для покупки будь-чого зі словами «ну воно ж по акції».",
  "Одеський вітер шепоче: ти вже досить зробив. Можна відпочити та не виправдовуватися.",
  "Твій гаманець просить порівняти ціни, а душа просить лимончик. Поважимо обидві сторони.",
  "Сьогодні компліменти приймати обов'язково, сперечатися із ними заборонено. Так ухвалила креветкова рада.",
  "Якщо хтось скаже «я на хвилинку», уточни, за одеським чи звичайним часом.",
  "Нехай день буде м'яким, як м'якуш правильно приготовленої креветки, і без неприємних сюрпризів усередині.",
];

const KNOWLEDGE_QUESTIONS = [
  { question: "Скільки ніг у більшості справжніх креветок?", options: ['4', '8', '10', '12'], correct: 2, explanation: "У десятиногих ракоподібних п'ять пар ходильних ніг, хоча будова різних груп може відрізнятися." },
  { question: "Як креветки зазвичай ростуть?", options: ["Змінюють панцир при линянні", "Відрощують новий хвіст щомісяця", "Набирають розмір без змін панцира", "Переходять на сушу"], correct: 0, explanation: "Жорсткий зовнішній панцир не росте разом із тілом, тому креветка періодично линяє." },
  { question: "Як називається креветка, відома потужним клацанням клешні?", options: ["Креветка-бджола", "Креветка-пістолет", "Креветка-скрипаль", "Креветка-молот"], correct: 1, explanation: "Креветки-пістолети створюють швидке клацання клешнею і кавітаційний пухирець." },
  { question: "Чи всі креветки живуть у солоній воді?", options: ["Так, без винятків", "Ні, є прісноводні види", "Тільки молоді", "Тільки тропічні"], correct: 1, explanation: "Існують численні прісноводні види креветок, що живуть у річках та озерах." },
  { question: "Що означає линяння у креветки?", options: ["Зміна панцира", "Зміна кольору щодня", "Перехід до іншого вигляду", "Підготовка до зимової сплячки"], correct: 0, explanation: "Під час линяння креветка скидає старий екзоскелет і деякий час залишається особливо вразливою." },
];

const DAILY = [
  { title: "Королівська креветка", emoji: '👑', line: "Тримаємо марку, але чек все одно зберігаємо." },
  { title: "Тигрова креветка", emoji: '🐅', line: "Характер смугастий, рішення виважені." },
  { title: "Північна креветка", emoji: '❄️', line: "Холодна голова, тепле серце, вигідна покупка." },
  { title: "Креветка-чистильник", emoji: '🧹', line: "Наводимо лад, але не забуваємо відпочити." },
  { title: "Креветка-пістолет", emoji: '✨', line: "Одне влучне слово краще за десять зайвих." },
  { title: "Прозора креветка", emoji: '💎', line: "Бачимо суть, помічаємо дрібний шрифт." },
  { title: "Креветка-богомол", emoji: '🥊', line: "Великі плани розпочинаються з одного кроку." },
];

function dayNumber() {
  const now = new Date();
  return Math.floor(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / 86400000);
}

export default function ShrimpMood() {
  const daily = useMemo(() => DAILY[((dayNumber() % DAILY.length) + DAILY.length) % DAILY.length], []);
  const [tab, setTab] = useState('daily');
  const [answers, setAnswers] = useState({});
  const [predictionIndex, setPredictionIndex] = useState(() => dayNumber() % PREDICTIONS.length);
  const [copied, setCopied] = useState(false);
  const [knowledgeIndex, setKnowledgeIndex] = useState(0);
  const [knowledgeAnswers, setKnowledgeAnswers] = useState([]);

  const complete = Object.keys(answers).length === QUESTIONS.length;
  const score = Object.values(answers).reduce((sum, value) => sum + value, 0);
  const result = SHRIMPS[Math.min(SHRIMPS.length - 1, Math.max(0, Math.round((score - QUESTIONS.length) / (QUESTIONS.length * 2) * (SHRIMPS.length - 1))))];
  const knowledgeComplete = knowledgeAnswers.length === KNOWLEDGE_QUESTIONS.length;
  const knowledgeScore = knowledgeAnswers.reduce((sum, answer, index) => sum + (answer === KNOWLEDGE_QUESTIONS[index].correct ? 1 : 0), 0);
  const dateLabel = new Intl.DateTimeFormat('uk-UA', { day: 'numeric', month: 'long' }).format(new Date());

  const shareText = tab === 'quiz' && complete
    ? `Сьогодні я — ${result.emoji} ${result.name}! ${result.advice}\nПеревір себе на ShrimpWatch: https://shrimp-watch.vercel.app/`
    : tab === 'knowledge' && knowledgeComplete
      ? `Мій результат креветкової вікторини: ${knowledgeScore}/${KNOWLEDGE_QUESTIONS.length}. А скільки ти набереш? https://shrimp-watch.vercel.app/`
      : tab === 'prediction'
        ? `Моє одеське креветкове передбачення: «${PREDICTIONS[predictionIndex]}»\nЗазирни на ShrimpWatch: https://shrimp-watch.vercel.app/`
        : `Креветка дня на ${dateLabel}: ${daily.emoji} ${daily.title}. ${daily.line}А ти яка креветка? https://shrimp-watch.vercel.app/`;

  async function share() {
    try {
      if (navigator.share) {
        await navigator.share({ title: "ShrimpWatch · Креветковий настрій", text: shareText, url: 'https://shrimp-watch.vercel.app/' });
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareText);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2200);
      } else {
        window.prompt("Скопіюй текст і відправ друзям:", shareText);
      }
    } catch (error) {
      if (error?.name !== 'AbortError') {
        try { window.prompt("Скопіюй текст і відправ друзям:", shareText); } catch {}
      }
    }
  }

  return <section className="mood-section" id="mood">
    <div className="mood-heading">
      <div>
        <div className="eyebrow"><Sparkles size={15} /> ОДЕСЬКИЙ ГОРОСКОП БЕЗ АСТРОЛОГІЧНОЇ ПАНІКИ</div>
        <h2>Креветковий настрій</h2>
        <p>Дізнайся, яка ти креветка, перевір морську ерудицію і отримай передбачення від ради креветки. Наукової сили гороскоп не має, зате настрій цілком справжній.</p>
      </div>
      <div className="mood-seal">🦐<small>СЬОГОДНІ<br/>ПО МОРЮ</small></div>
    </div>

    <div className="mood-tabs" role="tablist" aria-label="Розважальні розваги">
      <button type="button" role="tab" aria-selected={tab === 'daily'} className={tab === 'daily' ? 'mood-tab active' : 'mood-tab'} onClick={() => setTab('daily')}><Waves size={15}/> Креветка дня</button>
      <button type="button" role="tab" aria-selected={tab === 'quiz'} className={tab === 'quiz' ? 'mood-tab active' : 'mood-tab'} onClick={() => setTab('quiz')}><Fish size={15}/> Яка ти креветка?</button>
      <button type="button" role="tab" aria-selected={tab === 'knowledge'} className={tab === 'knowledge' ? 'mood-tab active' : 'mood-tab'} onClick={() => setTab('knowledge')}><Fish size={15}/> Морський тест</button>
      <button type="button" role="tab" aria-selected={tab === 'prediction'} className={tab === 'prediction' ? 'mood-tab active' : 'mood-tab'} onClick={() => setTab('prediction')}><Sparkles size={15}/> Пророцтво</button>
    </div>

    {tab === 'daily' && <article className="mood-feature" aria-live="polite">
      <div className="mood-emoji">{daily.emoji}</div>
      <div className="mood-copy"><span className="mood-kicker">ВИПУСК ВІД {dateLabel.toLocaleUpperCase('uk-UA')}</span><h3>{daily.title}</h3><p>{daily.line}</p><blockquote>«{daily.line} А якщо день піде не за планом, золотце, хоч би креветки не перетравлюй».</blockquote></div>
    </article>}

    {tab === 'quiz' && <div className="mood-quiz">
      {!complete ? <>
        <div className="mood-progress"><span>ПИТАННЯ {Object.keys(answers).length + 1} З {QUESTIONS.length}</span><div><i style={{ width: `${Object.keys(answers).length / QUESTIONS.length * 100}%` }}/></div></div>
        {QUESTIONS.map((item, index) => <fieldset className="mood-question" key={item.question}>
          <legend>{index + 1}. {item.question}</legend>
          <div className="mood-options">{item.answers.map(answer => <button type="button" key={answer.text} className={answers[index] === answer.points ? 'mood-option selected' : 'mood-option'} onClick={() => setAnswers(current => ({ ...current, [index]: answer.points }))}>{answer.text}</button>)}</div>
        </fieldset>)}
        <div className="mood-quiz-actions"><span>Дай відповідь на всі питання, і тітка Соня винесе вердикт.</span><button type="button" className="btn sonya-btn" disabled={Object.keys(answers).length !== QUESTIONS.length} onClick={() => setTab('quiz')}>Дізнатись результат <Sparkles size={15}/></button></div>
      </> : <article className="mood-result mood-personality-result" aria-live="polite">
        <div className="mood-emoji">{result.emoji}</div>
        <div className="mood-personality-copy"><span className="mood-kicker">ТЕТКА СОНЯ ПОРЯДАЛАСЯ</span><h3>Ти - {result.name}!</h3><b>{result.mood}</b><p>{result.description}</p><blockquote>Порада дня: {result.advice}</blockquote></div>
        <div className="mood-result-actions"><button type="button" className="btn sonya-btn" onClick={share}><Share2 size={16}/> Поділитись результатом</button><button type="button" className="btn dark" onClick={() => setAnswers({})}><RotateCcw size={15}/> Пройти заново</button></div>
      </article>}
    </div>}

    {tab === 'knowledge' && <div className="mood-quiz" aria-live="polite">
      {!knowledgeComplete ? <>
        <div className="mood-progress"><span>ПИТАННЯ {knowledgeIndex + 1} З {KNOWLEDGE_QUESTIONS.length}</span><div><i style={{ width: `${knowledgeAnswers.length / KNOWLEDGE_QUESTIONS.length * 100}%` }}/></div></div>
        <fieldset className="mood-question">
          <legend>{KNOWLEDGE_QUESTIONS[knowledgeIndex].question}</legend>
          <div className="mood-options mood-knowledge-options">{KNOWLEDGE_QUESTIONS[knowledgeIndex].options.map((option, index) => <button type="button" key={option} className={knowledgeAnswers.length > knowledgeIndex && knowledgeAnswers[knowledgeIndex] === index ? 'mood-option selected' : 'mood-option'} disabled={knowledgeAnswers.length > knowledgeIndex} onClick={() => setKnowledgeAnswers(current => [...current, index])}>{option}</button>)}</div>
        </fieldset>
        <p className="mood-knowledge-note">П'ять питань про морське життя. Жодних екзаменаційних комісій, тільки цікавість!</p>
      </> : <article className="mood-result">
        <div className="mood-emoji">{knowledgeScore === KNOWLEDGE_QUESTIONS.length ? '🏆' : knowledgeScore >= 3 ? '🐚' : '🦐'}</div>
        <span className="mood-kicker">ВЕРДИКТ МОРСЬКОЇ АКАДЕМІЇ ТІТИ СОНІ</span>
        <h3>{knowledgeScore} з {KNOWLEDGE_QUESTIONS.length} правильних відповідей!</h3>
        <p>{knowledgeScore === KNOWLEDGE_QUESTIONS.length ? "Такий морський професор! Тетя Соня просить автограф." : knowledgeScore >= 3 ? "Гарний улов знань! Ще кілька фактів, і консультуватимеш Привоз." : "Не біда, золотце. Море велике, дізнаватися ще багато цікавого."}</p>
        <div className="mood-knowledge-review">{KNOWLEDGE_QUESTIONS.map((item, index) => <div key={item.question}><b>{knowledgeAnswers[index] === item.correct ? '✓' : '•'} {item.question}</b><p>{item.explanation}</p></div>)}</div>
        <div className="mood-result-actions"><button type="button" className="btn sonya-btn" onClick={share}><Share2 size={16}/> Поділитись результатом</button><button type="button" className="btn dark" onClick={() => { setKnowledgeIndex(0); setKnowledgeAnswers([]); }}><RotateCcw size={15}/> Пройти заново</button></div>
      </article>}
      {!knowledgeComplete && knowledgeAnswers.length > 0 && <div className="mood-quiz-actions"><span>Відповідь прийнято. Рухаємось далі, золотце.</span><button type="button" className="btn sonya-btn" onClick={() => setKnowledgeIndex(index => Math.min(KNOWLEDGE_QUESTIONS.length - 1, index + 1))}>Наступне питання <Sparkles size={15}/></button></div>}
    </div>}

    {tab === 'prediction' && <article className="mood-prediction" aria-live="polite">
      <div className="mood-emoji">🔮</div><span className="mood-kicker">СЛОВО ВІД КРЕВЕТОЧНОЇ РАДИ</span><p>«{PREDICTIONS[predictionIndex]}»</p>
      <div className="mood-prediction-actions"><button type="button" className="btn sonya-btn" onClick={() => setPredictionIndex(index => (index + 1 + Math.floor(Math.random() * (PREDICTIONS.length - 1))) % PREDICTIONS.length)}><PartyPopper size={16}/> Ще пророцтво</button><button type="button" className="btn dark" onClick={share}><Share2 size={16}/> Поділитися</button></div>
    </article>}

    <div className="mood-footer"><span>Нехай прогнози будуть кумедними, а ціни прозорими.</span><button type="button" className="mood-share-link" onClick={share}>{copied ? <Copy size={14}/> : <Share2 size={14}/>} {copied ? "Текст скопійовано!" : "Поділитися креветковим настроєм"}</button></div>
  </section>;
}

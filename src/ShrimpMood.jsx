import { useMemo, useState } from 'react';
import { Copy, Share2, Sparkles, RotateCcw, Fish, Waves, PartyPopper } from 'lucide-react';

const SHRIMPS = [
  { name: 'Тигровая креветка', emoji: '🐅', mood: 'Королевская уверенность', description: 'Ты не повышаешь голос. Ты просто появляешься, и даже холодильник понимает, кто тут главный.', advice: 'Не уступай место в холодильнике и не соглашайся на подозрительные скидки.' },
  { name: 'Северная креветка', emoji: '❄️', mood: 'Спокойствие и расчёт', description: 'Пока остальные суетятся, ты уже сравнил цены, проверил состав и сохранил чек.', advice: 'Сохраняй холодную голову. Горячими пусть будут только креветки на сковородке.' },
  { name: 'Креветка-богомол', emoji: '🥊', mood: 'Энергия большого плана', description: 'Маленькая задача? Не сегодня. У тебя энергия человека, который пришёл на Привоз за укропом и вернулся с бизнес-планом.', advice: 'Направь энергию на одно важное дело. Не надо побеждать весь мир до обеда.' },
  { name: 'Креветка-пистолет', emoji: '🔫', mood: 'Мощный щелчок характера', description: 'Ты умеешь поставить точку одним метким замечанием. Вежливо, коротко, и все всё поняли.', advice: 'Сначала выдохни, потом щёлкай. Не каждый спор стоит твоего внутреннего моря.' },
  { name: 'Прозрачная креветка', emoji: '💎', mood: 'Тонкое чутьё', description: 'Ты видишь детали, которые другие пропускают. Особенно мелкий шрифт возле слова «акция».', advice: 'Доверяй интуиции, но проверяй ценник. Даже если продавец улыбается очень убедительно.' },
  { name: 'Креветка-чистильщик', emoji: '🧹', mood: 'Порядок и забота', description: 'Ты умеешь навести порядок в хаосе и помочь другим без лишнего спектакля.', advice: 'Позаботься сегодня и о себе. Даже самой полезной креветке нужен перерыв.' },
  { name: 'Королевская креветка', emoji: '👑', mood: 'Жить красиво', description: 'У тебя вкус, достоинство и талант находить маленькую роскошь даже в обычном вторнике.', advice: 'Позволь себе что-нибудь приятное, но сначала сравни цену. Корона короной, а бюджет любит уважение.' },
];

const QUESTIONS = [
  { question: 'На Привозе увидел подозрительную скидку. Твои действия?', answers: [{ text: 'Сравню цену и состав', points: 1 }, { text: 'Спрошу тётю Соню', points: 2 }, { text: 'Уже зову такси с холодильником', points: 3 }] },
  { question: 'Как ты решаешь сложные задачи?', answers: [{ text: 'Спокойно, по пунктам', points: 1 }, { text: 'С юмором и разговором', points: 2 }, { text: 'С эффектным щелчком', points: 3 }] },
  { question: 'Идеальный вечер?', answers: [{ text: 'Тишина, чай и порядок', points: 1 }, { text: 'Друзья, море и вкусная еда', points: 2 }, { text: 'Музыка, танцы и королевский размах', points: 3 }] },
  { question: 'Что важнее в креветочной жизни?', answers: [{ text: 'Надёжность и здравый смысл', points: 1 }, { text: 'Доброе сердце и хорошая компания', points: 2 }, { text: 'Характер и эффектное появление', points: 3 }] },
];

const PREDICTIONS = [
  'Сегодня море обстоятельств будет волноваться, а ты держись уверенно. И проверь карманы: удача любит мелочь.',
  'Тётя Соня постановила: не бери на себя чужую драму. У тебя своих дел полно, и все они достойны красивого финала.',
  'Возможна встреча с хорошей новостью и подозрительно приятной ценой. Проверяй обе, золотце.',
  'Сегодня твой главный суперскилл — вовремя сказать «таки нет». Пользуйся им без чувства вины.',
  'Звёзды советуют поесть нормально, выпить воды и не отвечать на сообщения, написанные на голодный желудок.',
  'На горизонте маячит маленькая радость. Не пройди мимо, потому что засмотрелся на ценник.',
  'День благоприятен для смелых решений, но не для покупки чего угодно со словами «ну оно же по акции».',
  'Одесский ветер шепчет: ты уже достаточно сделал. Можно отдохнуть и не оправдываться.',
  'Твой кошелёк просит сравнить цены, а душа просит лимончик. Уважим обе стороны.',
  'Сегодня комплименты принимать обязательно, спорить с ними запрещено. Так постановила креветочная рада.',
  'Если кто-то скажет «я на минутку», уточни, по одесскому или обычному времени.',
  'Пусть день будет мягким, как мякоть правильно приготовленной креветки, и без неприятных сюрпризов внутри.',
];

const KNOWLEDGE_QUESTIONS = [
  { question: 'Сколько ног у большинства настоящих креветок?', options: ['4', '8', '10', '12'], correct: 2, explanation: 'У десятиногих ракообразных пять пар ходильных ног, хотя строение разных групп может отличаться.' },
  { question: 'Как креветки обычно растут?', options: ['Меняют панцирь при линьке', 'Отращивают новый хвост каждый месяц', 'Набирают размер без изменений панциря', 'Переходят на сушу'], correct: 0, explanation: 'Жёсткий наружный панцирь не растёт вместе с телом, поэтому креветка периодически линяет.' },
  { question: 'Как называется креветка, известная мощным щелчком клешни?', options: ['Креветка-пчела', 'Креветка-пистолет', 'Креветка-скрипач', 'Креветка-молот'], correct: 1, explanation: 'Креветки-пистолеты создают быстрый щелчок клешнёй и кавитационный пузырёк.' },
  { question: 'Все ли креветки живут в солёной воде?', options: ['Да, без исключений', 'Нет, есть пресноводные виды', 'Только молодые', 'Только тропические'], correct: 1, explanation: 'Существуют многочисленные пресноводные виды креветок, живущие в реках и озёрах.' },
  { question: 'Что означает линька у креветки?', options: ['Смена панциря', 'Смена цвета каждый день', 'Переход в другой вид', 'Подготовка к зимней спячке'], correct: 0, explanation: 'Во время линьки креветка сбрасывает старый экзоскелет и некоторое время остаётся особенно уязвимой.' },
];

const DAILY = [
  { title: 'Королевская креветка', emoji: '👑', line: 'Держим марку, но чек всё равно сохраняем.' },
  { title: 'Тигровая креветка', emoji: '🐅', line: 'Характер полосатый, решения взвешенные.' },
  { title: 'Северная креветка', emoji: '❄️', line: 'Холодная голова, тёплое сердце, выгодная покупка.' },
  { title: 'Креветка-чистильщик', emoji: '🧹', line: 'Наводим порядок, но не забываем отдохнуть.' },
  { title: 'Креветка-пистолет', emoji: '✨', line: 'Одно меткое слово лучше десяти лишних.' },
  { title: 'Прозрачная креветка', emoji: '💎', line: 'Видим суть, замечаем мелкий шрифт.' },
  { title: 'Креветка-богомол', emoji: '🥊', line: 'Большие планы начинаются с одного шага.' },
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
  const dateLabel = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long' }).format(new Date());

  const shareText = tab === 'quiz' && complete
    ? `Сегодня я — ${result.emoji} ${result.name}! ${result.advice}\nПроверь себя на ShrimpWatch: https://shrimp-watch.vercel.app/`
    : tab === 'knowledge' && knowledgeComplete
      ? `Мой результат креветочной викторины: ${knowledgeScore}/${KNOWLEDGE_QUESTIONS.length}. А сколько наберёшь ты? https://shrimp-watch.vercel.app/`
      : tab === 'prediction'
        ? `Моё одесское креветочное предсказание: «${PREDICTIONS[predictionIndex]}»\nЗагляни на ShrimpWatch: https://shrimp-watch.vercel.app/`
        : `Креветка дня на ${dateLabel}: ${daily.emoji} ${daily.title}. ${daily.line}\nА ты какая креветка? https://shrimp-watch.vercel.app/`;

  async function share() {
    try {
      if (navigator.share) {
        await navigator.share({ title: 'ShrimpWatch · Креветочное настроение', text: shareText, url: 'https://shrimp-watch.vercel.app/' });
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareText);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2200);
      } else {
        window.prompt('Скопируй текст и отправь друзьям:', shareText);
      }
    } catch (error) {
      if (error?.name !== 'AbortError') {
        try { window.prompt('Скопируй текст и отправь друзьям:', shareText); } catch {}
      }
    }
  }

  return <section className="mood-section" id="mood">
    <div className="mood-heading">
      <div>
        <div className="eyebrow"><Sparkles size={15} /> ОДЕССКИЙ ГОРОСКОП БЕЗ АСТРОЛОГИЧЕСКОЙ ПАНИКИ</div>
        <h2>Креветочное настроение</h2>
        <p>Узнай, какая ты креветка, проверь морскую эрудицию и получи предсказание от креветочной рады. Научной силы у гороскопа нет, зато настроение вполне настоящее.</p>
      </div>
      <div className="mood-seal">🦐<small>СЕГОДНЯ<br/>ПО МОРЮ</small></div>
    </div>

    <div className="mood-tabs" role="tablist" aria-label="Креветочные развлечения">
      <button type="button" role="tab" aria-selected={tab === 'daily'} className={tab === 'daily' ? 'mood-tab active' : 'mood-tab'} onClick={() => setTab('daily')}><Waves size={15}/> Креветка дня</button>
      <button type="button" role="tab" aria-selected={tab === 'quiz'} className={tab === 'quiz' ? 'mood-tab active' : 'mood-tab'} onClick={() => setTab('quiz')}><Fish size={15}/> Какая ты креветка?</button>
      <button type="button" role="tab" aria-selected={tab === 'knowledge'} className={tab === 'knowledge' ? 'mood-tab active' : 'mood-tab'} onClick={() => setTab('knowledge')}><Fish size={15}/> Морской тест</button>
      <button type="button" role="tab" aria-selected={tab === 'prediction'} className={tab === 'prediction' ? 'mood-tab active' : 'mood-tab'} onClick={() => setTab('prediction')}><Sparkles size={15}/> Предсказание</button>
    </div>

    {tab === 'daily' && <article className="mood-feature" aria-live="polite">
      <div className="mood-emoji">{daily.emoji}</div>
      <div className="mood-copy"><span className="mood-kicker">ВЫПУСК ОТ {dateLabel.toLocaleUpperCase('ru-RU')}</span><h3>{daily.title}</h3><p>{daily.line}</p><blockquote>«{daily.line} А если день пойдёт не по плану, золотце, хотя бы креветки не переваривай».</blockquote></div>
    </article>}

    {tab === 'quiz' && <div className="mood-quiz">
      {!complete ? <>
        <div className="mood-progress"><span>ВОПРОС {Object.keys(answers).length + 1} ИЗ {QUESTIONS.length}</span><div><i style={{ width: `${Object.keys(answers).length / QUESTIONS.length * 100}%` }}/></div></div>
        {QUESTIONS.map((item, index) => <fieldset className="mood-question" key={item.question}>
          <legend>{index + 1}. {item.question}</legend>
          <div className="mood-options">{item.answers.map(answer => <button type="button" key={answer.text} className={answers[index] === answer.points ? 'mood-option selected' : 'mood-option'} onClick={() => setAnswers(current => ({ ...current, [index]: answer.points }))}>{answer.text}</button>)}</div>
        </fieldset>)}
        <div className="mood-quiz-actions"><span>Ответь на все вопросы, и тётя Соня вынесет вердикт.</span><button type="button" className="btn sonya-btn" disabled={Object.keys(answers).length !== QUESTIONS.length} onClick={() => setTab('quiz')}>Узнать результат <Sparkles size={15}/></button></div>
      </> : <article className="mood-result" aria-live="polite">
        <div className="mood-emoji">{result.emoji}</div><span className="mood-kicker">ТЁТЯ СОНЯ ПОСОВЕЩАЛАСЬ</span><h3>Ты — {result.name}!</h3><b>{result.mood}</b><p>{result.description}</p><blockquote>Совет дня: {result.advice}</blockquote>
        <div className="mood-result-actions"><button type="button" className="btn sonya-btn" onClick={share}><Share2 size={16}/> Поделиться результатом</button><button type="button" className="btn dark" onClick={() => setAnswers({})}><RotateCcw size={15}/> Пройти заново</button></div>
      </article>}
    </div>}

    {tab === 'knowledge' && <div className="mood-quiz" aria-live="polite">
      {!knowledgeComplete ? <>
        <div className="mood-progress"><span>ВОПРОС {knowledgeIndex + 1} ИЗ {KNOWLEDGE_QUESTIONS.length}</span><div><i style={{ width: `${knowledgeAnswers.length / KNOWLEDGE_QUESTIONS.length * 100}%` }}/></div></div>
        <fieldset className="mood-question">
          <legend>{KNOWLEDGE_QUESTIONS[knowledgeIndex].question}</legend>
          <div className="mood-options mood-knowledge-options">{KNOWLEDGE_QUESTIONS[knowledgeIndex].options.map((option, index) => <button type="button" key={option} className={knowledgeAnswers.length > knowledgeIndex && knowledgeAnswers[knowledgeIndex] === index ? 'mood-option selected' : 'mood-option'} disabled={knowledgeAnswers.length > knowledgeIndex} onClick={() => setKnowledgeAnswers(current => [...current, index])}>{option}</button>)}</div>
        </fieldset>
        <p className="mood-knowledge-note">Пять вопросов о морской жизни. Никаких экзаменационных комиссий, только любопытство!</p>
      </> : <article className="mood-result">
        <div className="mood-emoji">{knowledgeScore === KNOWLEDGE_QUESTIONS.length ? '🏆' : knowledgeScore >= 3 ? '🐚' : '🦐'}</div>
        <span className="mood-kicker">ВЕРДИКТ МОРСКОЙ АКАДЕМИИ ТЁТИ СОНИ</span>
        <h3>{knowledgeScore} из {KNOWLEDGE_QUESTIONS.length} правильных ответов!</h3>
        <p>{knowledgeScore === KNOWLEDGE_QUESTIONS.length ? 'Таки морской профессор! Тётя Соня просит автограф.' : knowledgeScore >= 3 ? 'Хороший улов знаний! Ещё пара фактов, и будешь консультировать Привоз.' : 'Не беда, золотце. Море большое, узнавать ещё много интересного.'}</p>
        <div className="mood-knowledge-review">{KNOWLEDGE_QUESTIONS.map((item, index) => <div key={item.question}><b>{knowledgeAnswers[index] === item.correct ? '✓' : '•'} {item.question}</b><p>{item.explanation}</p></div>)}</div>
        <div className="mood-result-actions"><button type="button" className="btn sonya-btn" onClick={share}><Share2 size={16}/> Поделиться результатом</button><button type="button" className="btn dark" onClick={() => { setKnowledgeIndex(0); setKnowledgeAnswers([]); }}><RotateCcw size={15}/> Пройти заново</button></div>
      </article>}
      {!knowledgeComplete && knowledgeAnswers.length > 0 && <div className="mood-quiz-actions"><span>Ответ принят. Двигаемся дальше, золотце.</span><button type="button" className="btn sonya-btn" onClick={() => setKnowledgeIndex(index => Math.min(KNOWLEDGE_QUESTIONS.length - 1, index + 1))}>Следующий вопрос <Sparkles size={15}/></button></div>}
    </div>}

    {tab === 'prediction' && <article className="mood-prediction" aria-live="polite">
      <div className="mood-emoji">🔮</div><span className="mood-kicker">СЛОВО ОТ КРЕВЕТОЧНОЙ РАДЫ</span><p>«{PREDICTIONS[predictionIndex]}»</p>
      <div className="mood-prediction-actions"><button type="button" className="btn sonya-btn" onClick={() => setPredictionIndex(index => (index + 1 + Math.floor(Math.random() * (PREDICTIONS.length - 1))) % PREDICTIONS.length)}><PartyPopper size={16}/> Ещё предсказание</button><button type="button" className="btn dark" onClick={share}><Share2 size={16}/> Поделиться</button></div>
    </article>}

    <div className="mood-footer"><span>Пусть прогнозы будут смешными, а цены прозрачными.</span><button type="button" className="mood-share-link" onClick={share}>{copied ? <Copy size={14}/> : <Share2 size={14}/>} {copied ? 'Текст скопирован!' : 'Поделиться креветочным настроением'}</button></div>
  </section>;
}

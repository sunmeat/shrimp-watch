import { useEffect, useRef, useState } from 'react';
import { Sparkles, Waves, ShieldCheck, Heart, Fish, Coffee, ChevronRight, ChefHat } from 'lucide-react';
import { SHRIMP_FACTS, SHRIMP_RECIPES } from './shrimp-content.js';
import ShrimpMood from './ShrimpMood.jsx';

const PRODUCT = "Королівська креветка сира, дефростована, 40/60";
const SONYA_WISHES = [
  "Ой, золотце, щоб у тебе все було і тобі за це нічого не було! А креветочка нехай буде по акції!",
  "Така ти людина з гарним смаком! Не щодня зустрінеш таку душу і таке полювання на знижки.",
  "Щоб здоров’я було міцним, настрій морський, а ціни в магазині маленькі-маленькі!",
  "Сонечка тобі бажає: грошей повний гаманець, вдома мир, на серці тепло, а креветки за ціною насіння!",
  "Ти подивися на нього, який розумник! І знижки шукає, і гарно живе. Щоб тобі все поверталося добром!",
  "Нехай море буде лагідним, одеський вітер попутним, а кожна покупка приносить радість, а не серцебиття на касі!",
  "Золотце, у тебе розумна голівка і добре серце. Щоб життя відповідало тобі тим самим!",
  "Щоб тобі зустрічалися хороші люди, чесні ціни та креветки за королівською знижкою!",
  "Ти людина з гідністю та смаком! Нехай удача сама кладе приємні сюрпризи у твій кошик.",
  "Бережи себе. Твій добробут важливіший за будь-яку знижку, навіть найкоролівськішу!",
  "Щоб удома було тепло, у серці спокійно, а на цінниках цифри тішили око!"
];

function squeak(context) {
  const now = context.currentTime;
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(780, now);
  oscillator.frequency.exponentialRampToValueAtTime(1450, now + 0.09);
  oscillator.frequency.exponentialRampToValueAtTime(620, now + 0.22);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.12, now + 0.025);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.24);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(now);
  oscillator.stop(now + 0.25);
}

export default function App() {
  const [status, setStatus] = useState(null);
  const [wishIndex, setWishIndex] = useState(() => Math.floor(Math.random() * SONYA_WISHES.length));
  const [danceParty, setDanceParty] = useState(false);
  const [factIndex, setFactIndex] = useState(() => Math.floor(Math.random() * SHRIMP_FACTS.length));
  const [recipeIndex, setRecipeIndex] = useState(0);
  const audioRef = useRef(null);
  const saleRef = useRef(false);

  useEffect(() => {
    let active = true;
    const loadStatus = async () => {
      try {
        const response = await fetch('/api/status', { cache: 'no-store' });
        if (!response.ok) return;
        const data = await response.json();
        if (!active) return;
        setStatus(data);
        saleRef.current = data.latestCheck?.priceScope !== 'reference_kyiv' && Boolean(data.latestCheck?.isSale) && Boolean(data.latestCheck?.checkedAt) && Date.now() - new Date(data.latestCheck.checkedAt).getTime() < 12 * 60 * 60 * 1000;
      } catch {
        if (active) setStatus(null);
      }
    };
    loadStatus();
    const timer = window.setInterval(loadStatus, 60_000);
    return () => { active = false; window.clearInterval(timer); };
  }, []);

  useEffect(() => {
    const enableAudio = () => {
      if (!audioRef.current) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) audioRef.current = new AudioContextClass();
      }
      if (audioRef.current?.state === 'suspended') audioRef.current.resume();
    };
    window.addEventListener('pointerdown', enableAudio, { once: true });
    window.addEventListener('keydown', enableAudio, { once: true });
    return () => {
      window.removeEventListener('pointerdown', enableAudio);
      window.removeEventListener('keydown', enableAudio);
    };
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (saleRef.current && audioRef.current?.state === 'running') squeak(audioRef.current);
    }, 2400);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setWishIndex((index) => (index + 1) % SONYA_WISHES.length), 12000);
    return () => window.clearInterval(timer);
  }, []);

  const triggerDance = () => {
    playDanceSqueak();
    setDanceParty(true);
    window.setTimeout(() => setDanceParty(false), 2200);
  };

  const playDanceSqueak = () => {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    if (!audioRef.current) audioRef.current = new AudioContextClass();
    const context = audioRef.current;
    if (context.state === 'suspended') {
      context.resume().then(() => squeak(context)).catch(() => {});
    } else {
      squeak(context);
    }
  };

  const latest = status?.latestCheck;
  const lastCheckTime = latest?.checkedAt ? new Date(latest.checkedAt).getTime() : NaN;
  const isFresh = Number.isFinite(lastCheckTime) && Date.now() - lastCheckTime >= 0 && Date.now() - lastCheckTime < 12 * 60 * 60 * 1000;
  const isReference = latest?.priceScope === 'reference_kyiv';
  const isSale = isFresh && !isReference && Boolean(latest?.isSale);
  const currentPrice = isFresh && latest && Number.isFinite(Number(latest.priceUah)) && Number(latest.priceUah) > 0 ? Number(latest.priceUah) : null;
  const priceHistory = (status?.priceHistory ?? []).filter(point => Number.isFinite(point.priceUah) && point.priceUah > 0);
  const historyWindow = priceHistory.slice(-14);
  const historyStart = historyWindow[0]?.priceUah;
  const priceIndex = historyWindow.length >= 2 && historyStart > 0 ? (historyWindow[historyWindow.length - 1].priceUah / historyStart) * 100 : null;
  const historyMin = historyWindow.length ? Math.min(...historyWindow.map(point => point.priceUah)) : null;
  const historyMax = historyWindow.length ? Math.max(...historyWindow.map(point => point.priceUah)) : null;
  const regularPrice = latest?.regularPriceUah;
  const discountPercent = currentPrice != null && regularPrice > currentPrice ? Math.round((1 - currentPrice / regularPrice) * 100) : null;
  const fact = SHRIMP_FACTS[factIndex];
  const recipe = SHRIMP_RECIPES[recipeIndex];
  const checkedAt = latest?.checkedAt ? new Date(latest.checkedAt).toLocaleString('uk-UA') : null;
  const observedAt = latest?.observedAt ? new Date(latest.observedAt).toLocaleString('uk-UA', { timeZone: 'Europe/Kyiv' }) : checkedAt;

  return <main className="shell odessa-shell">
    <div className="odessa-ribbon">ОДЕСА МАМА · МОРЕ ПОРУЧ · ЗНИЖКИ У СПРАВІ</div>
    <nav className="nav">
      <a className="brand" href="#"><span>🦐</span><b>SHRIMP<span>WATCH</span><small>КРЕВЕТОЧНА РОЗВЕДКА</small></b></a>
      <span className="live"><i/> {!isFresh ? "Дані застаріли" : isReference ? "Довідкова ціна: Київ" : isSale ? "Є знижка!" : "Ціна без акції"}</span>
    </nav>

    <section className="hero">
      <div>
        <div className="eyebrow"><Sparkles size={15}/> ПРИВІТ, ДУША МОЯ!</div>
        <h1>Якщо креветки — то королівські.<br/><em>Купувати коли вигідно.</em></h1>
        <p className="lead">У нас все по-одеськи: без паніки, з розмовою, з гарним настроєм і щоб покупка була вигідна, а не «мамо, що це було?».</p>
        <div className="actions"><a className="btn mint" href="#price"><Fish size={17}/> Ану, покажи ціну</a><a className="btn dark" href="#sonya"><Heart size={16}/> До тітки Соні</a></div>
        <div className="fine"><span>✓ Без зайвої метушні</span><span>✳ Планова перевірка 4 рази на добу</span></div>
      </div>
      <div className="hero-note sonya-hero">
        <div className="sonya-portrait">👒</div>
        <div className="eyebrow">ОДЕСЬКА СЛУЖБА ТУРТІ</div>
        <h2>Тетя Соня все бачить!</h2>
        <p>Не хвилюйся, золотце. Ми тут за цінами стежимо, креветочки танцюють, а життя, між іншим, чудова штука. Особливо коли зі знижкою.</p>
        <span className="sonya-sign">Цілую, обіймаю. Твоя Соня ❤️</span>
      </div>
    </section>

    <section className="dance-section" aria-label="Постійний танець креветок">
      <div className="dance-heading">
        <div><div className="eyebrow"><Waves size={15}/> Привіз не спить</div><h2>Танцюють, як на весіллі у племінниці.</h2></div>
        <span className={isSale ? 'sale-pill sale-active' : 'sale-pill'}><i/>{isSale ? "Акція! ПІ-ПІ-ПІ!" : "ПОКИ ТАНЦЮЄМО ДЛЯ ДУШІ"}</span>
      </div>
      <div className={`dance${danceParty ? ' party' : ''}`} role="button" tabIndex={0} aria-label="Натисніть, щоб влаштувати дискотеку креветок" onClick={triggerDance} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); triggerDance(); } }}>
        <div className="disco-beam beam-one"/><div className="disco-beam beam-two"/><div className="orbit one"/><div className="orbit two"/><div className="dance-floor"/>
        <span className="shrimp s1">🦐</span><span className="shrimp s2">🦐</span><span className="shrimp s3">🦐</span>
        <span className="shrimp s4">🦐</span><span className="shrimp s5">🦐</span><span className="shrimp s6">🦐</span><i className="star a">✦</i><i className="star b">✧</i><i className="star c">✺</i><i className="star d">✧</i><i className="confetti confetti-a">✦</i><i className="confetti confetti-b">✧</i><i className="confetti confetti-c">✷</i><i className="confetti confetti-d">✦</i><span className="disco-ball">✺</span>
        <div className="caption">♫ НЕ ТАНЦЮЄ ТІЛЬКИ ТІЙ, ХТО НЕ ЧУЄ МУЗИКУ</div>
      </div>
      <p className="sound-note">При виявленні акції креветки пищать. Натисніть на екрані, щоб дозволити звук. Ну шо, поїхали!</p>
    </section>

    <section className="cards" id="price">
      <article className="card price-card">
        <div className="label">КРЕВЕТОЧНИЙ КУРС <span className="tag">40/60</span></div>
        <div className="product">🦐</div><h2>Королівська креветка</h2><p>{PRODUCT}</p><hr/>
        <div className="price"><div><small>Ціна за 100 грамів, як належить</small><strong>{currentPrice != null ? currentPrice.toLocaleString('uk-UA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "Немає свіжої ціни"} <sub>{currentPrice != null ? "₴ / 100 г" : ''}</sub></strong></div><span>{!isFresh ? "⚠️ Перевірка застаріла" : isReference ? "📍 Ціна для Києва" : isSale ? "🎉 Є акція!" : "Без паніки"}<br/>{checkedAt ? isReference ? "Джерело: " + observedAt : "Перевірено: " + checkedAt : "Ціна вказана у картці Silpo"}</span></div>
        {!latest?.checkedAt && <p className="price-hint">У картці Silpo вказано {currentPrice != null ? currentPrice.toLocaleString('uk-UA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " грн за 100 г" : "що ціна поки не отримана"}. Автоматичний моніторинг ще не підтвердив її самостійно.</p>}
        <a className="link" href="https://silpo.ua/product/krevetka-korolivska-syra-defrostovana-40-60-864122" target="_blank" rel="noreferrer">Перевірити у продавця ↗</a>
        {isReference && <a className="link" href="https://forly.club/product/krevetka-korolivska-syra-defrostovana-40-60-eyy201-01m6z4dnjjqz69f83m0ceyy201?chain=silpo" target="_blank" rel="noreferrer">Джерело: Forly (Київ) ↗</a>}
      </article>
      <article className="card status-card">
        <div className="label">НАСТРІЙ НА ПРИВОЗІ <ShieldCheck size={15}/></div>
        <div className="status-icon">{isSale ? '🥳' : '☕'}</div>
        <h2>{isSale ? "О, тримайте мене семеро!" : "Спокійно, ми перевіримо все"}</h2>
        <p>{isReference && isFresh ? "Орієнтовна ціна Сільпо за даними Forly для Києва. Наявність і ціна в Одесі не підтверджені." : isFresh ? "Ціна нещодавно отримана. Наявність товару у магазині не підтверджено." : "Остання успішна перевірка застаріла. Ціна та акція приховані до нового підтвердження."}</p>
        <div className="warning">{isReference ? "Джерело: Forly.club. Ціна перевірена джерелом " + observedAt + ". Перевірка наявності в Одесі недоступна." : "Ціна береться зі сторінки товару. Наявність у конкретному магазині не підтверджується."}</div>
      </article>
    </section>


    <section className="facts-section" id="facts">
      <div className="facts-top">
        <div>
          <div className="eyebrow"><Sparkles size={15}/> МОРСЬКІ БАЙКИ, ЯКІ ПРАВДА</div>
          <h2>100 фактів про креветки</h2>
          <p>Біологія, підводне життя, види, їжа та хитрощі покупки. Один клік, і Соня дістає нову історію.</p>
        </div>
        <span className="facts-count">ФАКТ {factIndex + 1} / {SHRIMP_FACTS.length}</span>
      </div>
      <article className="fact-feature" aria-live="polite">
        <div className="fact-feature-icon">{fact.emoji}</div>
        <div className="fact-feature-copy">
          <span className="fact-category">{fact.category}</span>
          <h3>{fact.title}</h3>
          <p>{fact.text}</p>
        </div>
      </article>
      <div className="facts-actions">
        <button className="btn sonya-btn" type="button" onClick={() => setFactIndex(index => (index + 1) % SHRIMP_FACTS.length)}><Sparkles size={17}/> Ще факт! <ChevronRight size={17}/></button>
        <span>Натискай скільки завгодно: усі {SHRIMP_FACTS.length} фактів ходять по колу.</span>
      </div>
      <div className="facts-foot">Факти відносяться до різних видів креветок, тому формулювання уточнюють, коли властивість характерна не для всіх. Наука, золотце, любить точність! 🧠<div className="fact-sources">Джерела для перевірки: <a href="https://repository.library.noaa.gov/view/noaa/36212/noaa_36212_DS1.pdf" target="_blank" rel="noreferrer">довідник NOAA з біології креветок</a> · <a href="https://www.fda.gov/food/consumers/advice-about-eating-fish" target="_blank" rel="noreferrer">рекомендації FDA щодо морепродуктів</a> · <a href="https://www.fisheries.noaa.gov/insight/shrimp-recipes" target="_blank" rel="noreferrer">рецепти NOAA Fisheries</a></div></div>
    </section>

    <ShrimpMood />

    <section className="recipes-section" id="recipes">
      <div className="index-heading">
        <div>
          <div className="eyebrow"><ChefHat size={15}/> КУХНЯ ТЕТІ СОНІ</div>
          <h2>Ну шо, будемо смачно жити?</h2>
          <p>Десять домашніх ідей на будь-який апетит. Вибирай рецепт та не перетримуй креветочки!</p>
        </div>
        <span className="index-stamp">10 РЕЦЕПТІВ</span>
      </div>
      <div className="recipe-layout">
        <div className="recipe-list">
          {SHRIMP_RECIPES.map((item, index) => <button type="button" key={item.title} className={recipeIndex === index ? 'recipe-tab recipe-tab-active' : 'recipe-tab'} onClick={() => setRecipeIndex(index)}>
            <span>{item.emoji}</span><span className="recipe-tab-copy"><b>{item.title}</b><small>{item.time} · {item.servings}</small></span><ChevronRight size={16}/>
          </button>)}
        </div>
        <article className="recipe-detail" aria-live="polite">
          <div className="recipe-hero-icon">{recipe.emoji}</div>
          <div className="recipe-meta"><span>⏱ {recipe.time}</span><span>🍽 {recipe.servings}</span></div>
          <h3>{recipe.title}</h3><p className="recipe-subtitle">{recipe.subtitle}</p>
          <h4>Що знадобиться</h4>
          <ul className="ingredients">{recipe.ingredients.map(item => <li key={item}>{item}</li>)}</ul>
          <h4>Як готувати</h4>
          <ol className="recipe-steps">{recipe.steps.map(step => <li key={step}>{step}</li>)}</ol>
          <div className="recipe-safety">Важливо: готуй креветки до щільної, непрозорої м'якоті. Для орієнтиру FDA рекомендує внутрішню температуру морепродуктів близько 63 °C. Не залишай готову страву надовго за кімнатної температури.</div>
        </article>
      </div>
    </section>

    <section className="sonya-card" id="sonya">
      <div className="sonya-big">👒</div>
      <div className="sonya-copy">
        <div className="eyebrow"><Heart size={15}/> СЛОВО ВІД ТЕТКИ СОНІ</div>
        <h2>А тепер комплімент, і не сперечайся!</h2>
        <p className="sonya-wish">«{SONYA_WISHES[wishIndex]}»</p>
        <button className="btn sonya-btn" type="button" onClick={() => setWishIndex((index) => (index + 1 + Math.floor(Math.random() * (SONYA_WISHES.length - 1))) % SONYA_WISHES.length)}><Coffee size={17}/> Сонечко, ще побажання!</button>
      </div>
      <div className="sonya-stamp">ОДЕСА<br/>МАМА<br/>♥</div>
    </section>

    <section className="steps">
      <div><b>01</b><h3>Дивимося ціну</h3><p>Без фокусів та ворожінь, як на Дерибасівській.</p></div>
      <div><b>02</b><h3>Ловимо знижку</h3><p>Якщо ціна падає, розвідка креветки подає знак.</p></div>
      <div><b>03</b><h3>Живемо красиво</h3><p>Танцюємо, посміхаємося і пам'ятаємо: нерви дорожчі за креветки.</p></div>
    </section>
    <footer><b>🦐 SHRIMPWATCH · ОДЕСА МАМА</b><span>Щоб у тебе все було добре, а ціни були ще кращі!</span><small><i/> СВОЇМ ЗАВЖДИ РАДИ</small></footer>
  </main>;
}

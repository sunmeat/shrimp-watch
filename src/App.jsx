import { useEffect, useRef, useState } from 'react';
import { Bell, Mail, CircleCheck, Sparkles, Waves, ShieldCheck, Heart, Fish, Coffee, ChevronRight, TrendingUp, ChefHat } from 'lucide-react';
import { SHRIMP_FACTS, SHRIMP_RECIPES } from './shrimp-content.js';

const PRODUCT = 'Королевская креветка сырая, дефростированная, 40/60';
const SONYA_WISHES = [
  'Ой, золотце, шоб у тебя всё было и тебе за это ничего не было! А креветочка пусть будет по акции!',
  'Таки ты человек с хорошим вкусом! Не каждый день встретишь такую душу и такую охоту за скидками.',
  'Шоб здоровье было крепкое, настроение морское, а цены в магазине маленькие-маленькие!',
  'Сонечка тебе желает: денег полный кошелёк, дома мир, на сердце тепло, а креветки по цене семечек!',
  'Ты посмотри на него, какой умничка! И скидки ищет, и красиво живёт. Шоб тебе всё возвращалось добром!',
  'Пусть море будет ласковым, одесский ветер попутным, а каждая покупка приносит радость, а не сердцебиение на кассе!'
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
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [status, setStatus] = useState(null);
  const [wishIndex, setWishIndex] = useState(() => Math.floor(Math.random() * SONYA_WISHES.length));
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
        saleRef.current = Boolean(data.latestCheck?.isSale);
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

  const latest = status?.latestCheck;
  const isSale = Boolean(latest?.isSale);
  const currentPrice = latest?.checkedAt ? latest?.priceUah : null;
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
  const checkedAt = latest?.checkedAt ? new Date(latest.checkedAt).toLocaleString('ru-RU') : null;

  return <main className="shell odessa-shell">
    <div className="odessa-ribbon">ОДЕССА МАМА · МОРЕ РЯДОМ · СКИДКИ ПО ДЕЛУ</div>
    <nav className="nav">
      <a className="brand" href="#"><span>🦐</span><b>SHRIMP<span>WATCH</span><small>КРЕВЕТОЧНАЯ РАЗВЕДКА</small></b></a>
      <span className="live"><i/> СВОИ ЦЕНЫ ЗНАЕМ</span>
    </nav>

    <section className="hero">
      <div>
        <div className="eyebrow"><Sparkles size={15}/> ПРИВЕТ, ДУША МОЯ!</div>
        <h1>Море рядом.<br/><em>Креветки по уму.</em></h1>
        <p className="lead">У нас всё по-одесски: без паники, с разговором, с хорошим настроением и чтоб покупка была выгодная, а не «мама, шо это было?».</p>
        <div className="actions"><a className="btn mint" href="#price"><Fish size={17}/> Ну-ка, покажи цену</a><a className="btn dark" href="#sonya"><Heart size={16}/> К тёте Соне</a></div>
        <div className="fine"><span>✓ Без лишней суеты</span><span>✳ Проверяем цену каждые 6 часов</span></div>
      </div>
      <div className="hero-note sonya-hero">
        <div className="sonya-portrait">👒</div>
        <div className="eyebrow">ОДЕССКАЯ СЛУЖБА ЗАБОТЫ</div>
        <h2>Тётя Соня всё видит!</h2>
        <p>Не волнуйся, золотце. Мы тут за ценами следим, креветочки танцуют, а жизнь, между прочим, прекрасная штука. Особенно когда со скидкой.</p>
        <span className="sonya-sign">Целую, обнимаю. Твоя Соня ❤️</span>
      </div>
    </section>

    <section className="dance-section" aria-label="Постоянный танец креветок">
      <div className="dance-heading">
        <div><div className="eyebrow"><Waves size={15}/> ПРИВОЗ НЕ СПИТ</div><h2>Танцуют, как на свадьбе у племянницы.</h2></div>
        <span className={isSale ? 'sale-pill sale-active' : 'sale-pill'}><i/>{isSale ? 'АКЦИЯ! ПИ-ПИ-ПИ!' : 'ПОКА ТАНЦУЕМ ДЛЯ ДУШИ'}</span>
      </div>
      <div className="dance">
        <div className="orbit one"/><div className="orbit two"/>
        <span className="shrimp s1">🦐</span><span className="shrimp s2">🦐</span><span className="shrimp s3">🦐</span>
        <span className="shrimp s4">🦐</span><i className="star a">✦</i><i className="star b">✧</i>
        <div className="caption">♫ НЕ ТАНЦУЕТ ТОЛЬКО ТОТ, КТО НЕ СЛЫШИТ МУЗЫКУ</div>
      </div>
      <p className="sound-note">При обнаружении акции креветки пищат. На телефоне сначала коснись экрана, чтобы разрешить звук. Ну шо, поехали!</p>
    </section>

    <section className="cards" id="price">
      <article className="card price-card">
        <div className="label">КРЕВЕТОЧНЫЙ КУРС <span className="tag">40/60</span></div>
        <div className="product">🦐</div><h2>Королевская креветка</h2><p>{PRODUCT}</p><hr/>
        <div className="price"><div><small>Цена за 100 граммов, как положено</small><strong>{currentPrice != null ? currentPrice.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : 'Ждём'} <sub>{currentPrice != null ? '₴ / 100 г' : ''}</sub></strong></div><span>{isSale ? '🎉 Есть акция!' : 'Без паники'}<br/>{checkedAt ? 'Проверено: ' + checkedAt : 'Ждём свежую проверку'}</span></div>
        {!latest?.checkedAt && <p className="price-hint">Тётя Соня не станет выдумывать цифры. Как только мониторинг получит свежую цену, она появится здесь.</p>}
        <a className="link" href="https://silpo.ua/product/krevetka-korolivska-syra-defrostovana-40-60-864122" target="_blank" rel="noreferrer">Проверить у продавца ↗</a>
      </article>
      <article className="card status-card">
        <div className="label">НАСТРОЕНИЕ НА ПРИВОЗЕ <ShieldCheck size={15}/></div>
        <div className="status-icon">{isSale ? '🥳' : '☕'}</div>
        <h2>{isSale ? 'Ой, держите меня семеро!' : 'Спокойно, мы всё проверим'}</h2>
        <p>{latest?.checkedAt ? 'Цена получена, наблюдение продолжается. Статус обновляется автоматически.' : 'Мониторинг ждёт успешной проверки страницы товара. Старые цифры за свежие выдавать не будем.'}</p>
        <div className="warning">Цена берётся с публичной страницы товара. Наличие в конкретном магазине не подтверждается.</div>
      </article>
    </section>


    <section className="facts-section" id="facts">
      <div className="facts-top">
        <div>
          <div className="eyebrow"><Sparkles size={15}/> МОРСКИЕ БАЙКИ, КОТОРЫЕ ПРАВДА</div>
          <h2>100 фактов о креветках. И ни одного про скуку.</h2>
          <p>Биология, подводная жизнь, виды, еда и хитрости покупки. Один клик, и Соня достаёт новую историю.</p>
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
        <button className="btn sonya-btn" type="button" onClick={() => setFactIndex(index => (index + 1) % SHRIMP_FACTS.length)}><Sparkles size={17}/> Ещё факт! <ChevronRight size={17}/></button>
        <span>Нажимай сколько угодно: все {SHRIMP_FACTS.length} фактов ходят по кругу.</span>
      </div>
      <div className="facts-foot">Факты относятся к разным видам креветок, поэтому формулировки уточняют, когда свойство характерно не для всех. Наука, золотце, любит точность! 🧠</div>
    </section>

    <section className="index-section" id="index">
      <div className="index-heading">
        <div>
          <div className="eyebrow"><TrendingUp size={15}/> КРЕВЕТОЧНАЯ БИРЖА</div>
          <h2>Креветочный индекс</h2>
          <p>Смотрим, как меняется цена королевской креветки. Никаких гаданий на панцире.</p>
        </div>
        <span className="index-stamp">100 г · ₴</span>
      </div>
      <div className="index-metrics">
        <div className="index-metric"><small>ТЕКУЩАЯ ЦЕНА</small><strong>{currentPrice != null ? currentPrice.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ₴' : 'Ожидаем замер'}</strong><span>за 100 г</span></div>
        <div className="index-metric"><small>ЗА КИЛОГРАММ</small><strong>{currentPrice != null ? (currentPrice * 10).toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ₴' : 'Пока нет данных'}</strong><span>пересчёт по текущей цене</span></div>
        <div className="index-metric"><small>ИНДЕКС К БАЗОВОМУ ЗАМЕРУ</small><strong>{priceIndex != null ? priceIndex.toLocaleString('ru-RU', { maximumFractionDigits: 1 }) : 'Собираем историю'}</strong><span>{priceIndex != null ? (priceIndex < 100 ? 'Цена снизилась от первого замера' : priceIndex > 100 ? 'Цена выросла от первого замера' : 'Цена на уровне первого замера') : 'Нужно минимум 2 проверенных замера'}</span></div>
        {discountPercent != null && <div className="index-metric"><small>СКИДКА К ОБЫЧНОЙ ЦЕНЕ</small><strong>{discountPercent}%</strong><span>по данным страницы товара</span></div>}
      </div>
      <div className="chart-panel">
        <div className="chart-title"><b>Последние замеры</b><span>{historyWindow.length ? `${historyWindow.length} точек` : 'История начнёт расти после успешных проверок'}</span></div>
        {historyWindow.length >= 2 ? <div className="price-chart" role="img" aria-label="График последних цен на креветки">
          {historyWindow.map((point, index) => {
            const range = (historyMax ?? 0) - (historyMin ?? 0);
            const height = range === 0 ? 54 : 18 + ((point.priceUah - historyMin) / range) * 72;
            return <div className="chart-column" key={point.checkedAt + index} title={new Date(point.checkedAt).toLocaleString('ru-RU') + ': ' + point.priceUah + ' грн'}>
              <span className="chart-value">{point.priceUah.toLocaleString('ru-RU', { maximumFractionDigits: 1 })}</span>
              <div className="chart-bar" style={{ height: height + '%' }}/>
              <small>{new Date(point.checkedAt).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })}</small>
            </div>;
          })}
        </div> : <div className="chart-empty"><span>📉</span><b>Биржа собирает первые котировки</b><p>После нескольких успешных проверок здесь появится график, а индекс будет считаться от первого сохранённого замера.</p></div>}
        <p className="chart-note">Индекс = текущая цена ÷ цена первого отображаемого замера × 100. Значение 100 означает, что цена не изменилась. История начинается с момента включения сохранения замеров.</p>
      </div>
    </section>

    <section className="recipes-section" id="recipes">
      <div className="index-heading">
        <div>
          <div className="eyebrow"><ChefHat size={15}/> КУХНЯ ТЁТИ СОНИ</div>
          <h2>Ну шо, будем вкусно жить?</h2>
          <p>Пять проверенных домашних идей. Выбирай рецепт, готовь и не передерживай креветочки!</p>
        </div>
        <span className="index-stamp">5 РЕЦЕПТОВ</span>
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
          <h4>Что понадобится</h4>
          <ul className="ingredients">{recipe.ingredients.map(item => <li key={item}>{item}</li>)}</ul>
          <h4>Как готовить</h4>
          <ol className="recipe-steps">{recipe.steps.map(step => <li key={step}>{step}</li>)}</ol>
          <div className="recipe-safety">Важно: готовь креветки до плотной, непрозрачной мякоти. Для ориентира FDA рекомендует внутреннюю температуру морепродуктов около 63 °C. Не оставляй готовое блюдо надолго при комнатной температуре.</div>
        </article>
      </div>
    </section>

    <section className="sonya-card" id="sonya">
      <div className="sonya-big">👒</div>
      <div className="sonya-copy">
        <div className="eyebrow"><Heart size={15}/> СЛОВО ОТ ТЁТИ СОНИ</div>
        <h2>А теперь комплимент, и не спорь!</h2>
        <p className="sonya-wish">«{SONYA_WISHES[wishIndex]}»</p>
        <button className="btn sonya-btn" type="button" onClick={() => setWishIndex((index) => (index + 1 + Math.floor(Math.random() * (SONYA_WISHES.length - 1))) % SONYA_WISHES.length)}><Coffee size={17}/> Сонечка, ещё пожелание!</button>
      </div>
      <div className="sonya-stamp">ОДЕССА<br/>МАМА<br/>♥</div>
    </section>

    <section className="alerts" id="alerts">
      <div><div className="eyebrow"><Mail size={15}/> ПИСЬМО С ПРИВОЗА</div><h2>Пусть скидка<br/>сама тебя найдёт.</h2><p>Форма пока демонстрационная: адрес не отправляется и не сохраняется. Не обещаем писем, пока не подключена отправка.</p></div>
      <form onSubmit={e => {e.preventDefault();setSubmitted(true)}}>
        <label htmlFor="email">ТВОЙ EMAIL</label>
        <div className="input"><Mail size={17}/><input id="email" type="email" placeholder="you@example.com" value={email} onChange={e=>{setEmail(e.target.value);setSubmitted(false)}} required/></div>
        <button className="btn mint full" type="submit">{submitted ? <><CircleCheck size={17}/> Это пока демо, золотце</> : <><Bell size={17}/> Хочу знать о скидке</>}</button>
        <small className="note">Никакие введённые данные не сохраняются.</small>
      </form>
    </section>

    <section className="steps">
      <div><b>01</b><h3>Смотрим цену</h3><p>Без фокусов и гаданий, как на Дерибасовской.</p></div>
      <div><b>02</b><h3>Ловим скидку</h3><p>Если цена падает, креветочная разведка подаёт знак.</p></div>
      <div><b>03</b><h3>Живём красиво</h3><p>Танцуем, улыбаемся и помним: нервы дороже креветок.</p></div>
    </section>
    <footer><b>🦐 SHRIMPWATCH · ОДЕССА МАМА</b><span>Шоб у тебя всё было хорошо, а цены были хорошие ещё лучше!</span><small><i/> СВОИМ ВСЕГДА РАДЫ</small></footer>
  </main>;
}

import { useEffect, useRef, useState } from 'react';
import { Bell, Mail, CircleCheck, Sparkles, Waves, ShieldCheck, Heart, Fish, Coffee } from 'lucide-react';

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
  const currentPrice = latest?.priceUah;
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
          <h2>Креветки. Маленькие, а понтов на целый океан.</h2>
          <p>Тётя Соня собрала самое интересное. Читай, удивляйся и блесни знаниями за ужином.</p>
        </div>
        <span className="facts-count">8 ФАКТОВ · 0 ВОДЫ</span>
      </div>
      <div className="facts-grid">
        <article className="fact-card"><span>👀</span><b>Глаза на стебельках</b><p>У многих креветок глаза расположены на подвижных стебельках. У некоторых видов зрение помогает замечать движение и ориентироваться в сложном подводном мире.</p></article>
        <article className="fact-card"><span>🦐</span><b>Панцирь не навсегда</b><p>Креветка растёт и периодически линяет: сбрасывает старый наружный скелет, а затем формирует новый. После линьки она особенно уязвима.</p></article>
        <article className="fact-card"><span>💓</span><b>Сердце не там, где ждёшь</b><p>Сердце креветки находится в головогруди, ближе к спинной стороне. Кровеносная система у неё открытая, не такая, как у человека.</p></article>
        <article className="fact-card"><span>🌊</span><b>Не все живут в море</b><p>Есть пресноводные креветки, морские и солоноватоводные. Они встречаются от мелких ручьёв и мангровых зарослей до больших океанских глубин.</p></article>
        <article className="fact-card"><span>🧹</span><b>Подводные уборщики</b><p>Многие виды питаются органическими остатками и мелкими организмами. Так они участвуют в переработке веществ и пищевых цепях водоёмов.</p></article>
        <article className="fact-card"><span>🤝</span><b>Есть креветки-помощники</b><p>Некоторые чистящие креветки удаляют паразитов и отмершие ткани с рыб. Рыбы приходят к ним на специальные «станции чистки».</p></article>
        <article className="fact-card"><span>🔊</span><b>Могут щёлкать громче, чем кажется</b><p>Креветки-щелкуны резко захлопывают увеличенную клешню и создают мощный щелчок с кавитационным пузырьком. Это помогает им охотиться и защищаться.</p></article>
        <article className="fact-card"><span>📏</span><b>40/60 это не размер в сантиметрах</b><p>В торговой маркировке 40/60 обычно означает ориентировочное количество креветок на килограмм. Чем меньше число, тем крупнее креветки. Точная трактовка может зависеть от стандарта продавца.</p></article>
      </div>
      <div className="facts-foot">Маленькая ремарка от Сони: креветки бывают очень разными, так что не каждый факт подходит каждому виду. Наука, золотце, любит точность! 🧠</div>
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

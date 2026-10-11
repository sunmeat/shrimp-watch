import { useEffect, useRef, useState } from 'react';
import { Bell, Mail, CircleCheck, Sparkles, Waves, ShieldCheck } from 'lucide-react';

const PRODUCT = 'Королевская креветка сырая, дефростированная, 40/60';

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
    return () => {
      active = false;
      window.clearInterval(timer);
    };
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

  const isSale = Boolean(status?.latestCheck?.isSale);
  const currentPrice = status?.latestCheck?.priceUah;
  const checkedAt = status?.latestCheck?.checkedAt
    ? new Date(status.latestCheck.checkedAt).toLocaleString('ru-RU')
    : null;

  return <main className="shell">
    <nav className="nav">
      <a className="brand" href="#"><span>🦐</span><b>SHRIMP<span>WATCH</span><small>КРЕВЕТОЧНАЯ РАЗВЕДКА</small></b></a>
      <span className="live"><i/> МОНИТОРИНГ ЦЕН</span>
    </nav>

    <section className="hero">
      <div>
        <div className="eyebrow"><Sparkles size={15}/> ОПЕРАЦИЯ «ВЫГОДНАЯ КРЕВЕТКА»</div>
        <h1>Ловим скидки.<br/><em>Не креветок.</em></h1>
        <p className="lead">Следим за ценой королевских креветок. Появится акция, и креветочная разведка подаст сигнал.</p>
        <div className="actions"><a className="btn mint" href="#alerts"><Bell size={17}/> Настроить уведомления</a></div>
        <div className="fine"><span>✓ Без лишнего спама</span><span>✳ Проверка по расписанию</span></div>
      </div>
      <div className="hero-note">
        <ShieldCheck size={30}/>
        <h2>Никаких лишних деталей</h2>
        <p>На странице нет адреса магазина или карты. Только креветочные новости и цена.</p>
      </div>
    </section>

    <section className="dance-section" aria-label="Постоянный танец креветок">
      <div className="dance-heading">
        <div><div className="eyebrow"><Waves size={15}/> КРЕВЕТОЧНЫЙ ТАНЦПОЛ</div><h2>Танцуют всегда.</h2></div>
        <span className={isSale ? 'sale-pill sale-active' : 'sale-pill'}><i/>{isSale ? 'АКЦИЯ! ПИ-ПИ-ПИ!' : 'ЖДЁМ СКИДКУ'}</span>
      </div>
      <div className="dance">
        <div className="orbit one"/><div className="orbit two"/>
        <span className="shrimp s1">🦐</span><span className="shrimp s2">🦐</span><span className="shrimp s3">🦐</span>
        <span className="shrimp s4">🦐</span><i className="star a">✦</i><i className="star b">✧</i>
        <div className="caption">♫ ДВИЖЕНИЕ НЕ ПРЕКРАЩАЕТСЯ</div>
      </div>
      <p className="sound-note">При обнаружении акции креветки пищат. Для звука коснись экрана один раз: мобильный браузер должен разрешить воспроизведение.</p>
    </section>

    <section className="cards">
      <article className="card">
        <div className="label">ЦЕЛЬ ОПЕРАЦИИ <span className="tag">40/60</span></div>
        <div className="product">🦐</div><h2>Королевские креветки</h2><p>{PRODUCT}</p><hr/>
        <div className="price"><div><small>Последняя цена на странице товара</small><strong>{currentPrice != null ? currentPrice.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—'} <sub>₴ / 100 г</sub></strong></div><span>{isSale ? 'Обнаружена акция' : 'Статус цены'}<br/>{checkedAt ? 'Проверено: ' + checkedAt : 'Ожидаем проверки'}</span></div>
      </article>
      <article className="card status-card">
        <div className="label">СОСТОЯНИЕ РАЗВЕДКИ <ShieldCheck size={15}/></div>
        <div className="status-icon">{isSale ? '🎉' : '📡'}</div>
        <h2>{isSale ? 'Есть повод пищать!' : 'Наблюдение продолжается'}</h2>
        <p>{status?.latestCheck ? 'Последняя проверка цены получена. Данные обновляются автоматически.' : 'Ожидаем первую успешную проверку источника цен.'}</p>
        <div className="warning">Цена берётся с публичной страницы товара. Наличие в конкретном магазине не подтверждается.</div>
      </article>
    </section>

    <section className="alerts" id="alerts">
      <div><div className="eyebrow"><Mail size={15}/> СИГНАЛ ПО ПОЧТЕ</div><h2>Пусть скидка<br/>сама тебя найдёт.</h2><p>Форма пока демонстрационная: адрес не отправляется и не сохраняется на сервере.</p></div>
      <form onSubmit={e => {e.preventDefault();setSubmitted(true)}}>
        <label htmlFor="email">ТВОЙ EMAIL</label>
        <div className="input"><Mail size={17}/><input id="email" type="email" placeholder="you@example.com" value={email} onChange={e=>{setEmail(e.target.value);setSubmitted(false)}} required/></div>
        <button className="btn mint full" type="submit">{submitted ? <><CircleCheck size={17}/> Адрес принят в демо</> : <><Bell size={17}/> Хочу знать о скидке</>}</button>
        <small className="note">Никакие введённые данные не сохраняются.</small>
      </form>
    </section>

    <section className="steps">
      <div><b>01</b><h3>Следим за ценой</h3><p>Проверяем публичную страницу товара по расписанию.</p></div>
      <div><b>02</b><h3>Ловим скидку</h3><p>Сравниваем цену и ищем признаки акции.</p></div>
      <div><b>03</b><h3>Включаем диско</h3><p>Креветки танцуют постоянно и пищат при акции.</p></div>
    </section>
    <footer><b>🦐 SHRIMPWATCH</b><span>Сделано с любовью к морепродуктам и скидкам.</span><small><i/> КРЕВЕТОЧНЫЙ МОНИТОРИНГ</small></footer>
  </main>;
}

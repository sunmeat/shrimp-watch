import { useState } from 'react';
import { Bell, MapPin, Mail, ArrowUpRight, CircleCheck, Waves, Sparkles } from 'lucide-react';

const STORE = 'Сільпо · Фонтанська дорога, 58, Одеса';
const PRODUCT = 'Креветка королівська, сира, дефростована, 40/60';

export default function App() {
  const [party, setParty] = useState(false);
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  return <main className="shell">
    <nav className="nav"><a className="brand" href="#"><span>🦐</span><b>SHRIMP<span>WATCH</span><small>КРЕВЕТОЧНАЯ РАЗВЕДКА</small></b></a><span className="live"><i/> НАБЛЮДЕНИЕ</span></nav>
    <section className="hero"><div><div className="eyebrow"><Sparkles size={15}/> ОПЕРАЦИЯ «ВЫГОДНАЯ КРЕВЕТКА»</div><h1>Ловим скидки.<br/><em>Не креветок.</em></h1><p className="lead">Следим за ценой королевских креветок в твоём Сільпо. Появится акция — узнаешь первым.</p><div className="actions"><a className="btn mint" href="#alerts"><Bell size={17}/> Настроить уведомления</a><button className="btn dark" onClick={() => setParty(!party)}><Waves size={17}/> {party ? 'Стоп танцы' : 'Проверить танец'}</button></div><div className="fine">✓ Без лишнего спама <span>✳ Проверка по расписанию</span></div></div>
      <div className={'dance ' + (party ? 'party' : '')}><div className="orbit one"/><div className="orbit two"/><span className="shrimp s1">🦐</span><span className="shrimp s2">🦐</span><span className="shrimp s3">🦐</span><i className="star a">✦</i><i className="star b">✧</i><div className="caption">♫ КРЕВЕТОЧНЫЙ ТАНЦПОЛ</div></div></section>
    <section className="cards"><article className="card"><div className="label">ЦЕЛЬ ОПЕРАЦИИ <span className="tag">40/60</span></div><div className="product">🦐</div><h2>Королевские креветки</h2><p>{PRODUCT}</p><hr/><div className="price"><div><small>Последняя известная цена</small><strong>69,90 <sub>₴ / 100 г</sub></strong></div><span>Требуется<br/>актуальная проверка</span></div></article>
      <article className="card"><div className="label">НАШ ПОСТ НАБЛЮДЕНИЯ <MapPin size={15}/></div><div className="map"><span>📍</span><small>ODESA · UKRAINE</small></div><h2>Твоё Сільпо</h2><p>{STORE}</p><a className="link" href="https://maps.app.goo.gl/njf9mi7c1E47czieA" target="_blank" rel="noreferrer">Открыть карту <ArrowUpRight size={15}/></a><div className="warning">Онлайн-цена и наличие в конкретном магазине могут отличаться.</div></article></section>
    <section className="alerts" id="alerts"><div><div className="eyebrow"><Mail size={15}/> СИГНАЛ ПО ПОЧТЕ</div><h2>Пусть скидка<br/>сама тебя найдёт.</h2><p>Укажи email для уведомлений. Отправка писем заработает после подключения почтового сервиса.</p></div><form onSubmit={e => {e.preventDefault();setSubmitted(true)}}><label htmlFor="email">ТВОЙ EMAIL</label><div className="input"><Mail size={17}/><input id="email" type="email" placeholder="you@example.com" value={email} onChange={e=>{setEmail(e.target.value);setSubmitted(false)}} required/></div><button className="btn mint full" type="submit">{submitted ? <><CircleCheck size={17}/> Адрес принят в демо</> : <><Bell size={17}/> Хочу знать о скидке</>}</button><small className="note">Демо: адрес пока не отправляется на сервер и не сохраняется.</small></form></section>
    <section className="steps"><div><b>01</b><h3>Следим за ценой</h3><p>Подключаем источник актуальных цен и акций Сільпо.</p></div><div><b>02</b><h3>Ловим скидку</h3><p>Сравниваем цену и проверяем, что акция настоящая.</p></div><div><b>03</b><h3>Включаем диско</h3><p>Креветки танцуют, почта сообщает о выгоде.</p></div></section>
    <footer><b>🦐 SHRIMPWATCH</b><span>Сделано с любовью к морепродуктам и скидкам.</span><small><i/> ПРОТОТИП ИНТЕРФЕЙСА</small></footer>
  </main>;
}

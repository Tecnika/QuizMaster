import { Link } from 'react-router-dom';

export default function RulesPage() {
  return (
    <div>
      <div className="qm-page-head">
        <div>
          <div className="qm-eyebrow">Свод правил</div>
          <h1 className="qm-title">Как играть</h1>
          <p className="qm-subtitle">Кратко о двух форматах и о том, как работает сессия.</p>
        </div>
        <Link className="qm-btn qm-btn-ghost" to="/join">Присоединиться</Link>
      </div>

      <section className="qm-card" id="millionaire">
        <div className="qm-eyebrow">Формат 1</div>
        <h2 className="qm-title">Кто хочет стать миллионером?</h2>
        <p>15 вопросов с четырьмя вариантами ответа. Сложность растёт, каждый верный ответ поднимает по лестнице.</p>
        <div className="qm-grid qm-grid-3 qm-mt">
          <div className="qm-stat"><b>15</b><span>вопросов</span></div>
          <div className="qm-stat"><b>3</b><span>несгораемых рубежа</span></div>
          <div className="qm-stat"><b>3</b><span>подсказки</span></div>
        </div>
        <h3 className="qm-mt">Лестница</h3>
        <p className="qm-small">
          100 · 200 · 300 · 500 · <b>1000</b> · 2000 · 4000 · 8000 · 16000 · <b>32000</b> · 64000 · 125000 · 250000 · 500000 · <b>1 000 000</b>
        </p>
        <p>Неверный ответ — падение до последней несгораемой суммы. Подсказки: 50/50, помощь зала, звонок другу.</p>
        <p className="qm-small">Источник: <a className="qm-link" href="https://ru.wwbm.com/rules" target="_blank" rel="noreferrer">ru.wwbm.com/rules</a></p>
      </section>

      <section className="qm-card" id="svoya">
        <div className="qm-eyebrow">Формат 2</div>
        <h2 className="qm-title">Своя игра</h2>
        <p>Табло с темами и стоимостями. Команды выбирают вопрос, ведущий зачитывает, участники отвечают.</p>
        <div className="qm-grid qm-grid-3 qm-mt">
          <div className="qm-stat"><b>3</b><span>раунда</span></div>
          <div className="qm-stat"><b>6</b><span>тем в раунде</span></div>
          <div className="qm-stat"><b>5</b><span>стоимостей</span></div>
        </div>
        <h3 className="qm-mt">Стоимости</h3>
        <p className="qm-small">Раунд 1: 100–500 · Раунд 2: 200–1000 · Раунд 3: 300–1500</p>
        <p>Верный ответ прибавляет стоимость, неверный — вычитает. Соперники могут перехватить ответ.</p>
        <p><b>«Кот в мешке»</b> — вопрос передаётся сопернику. <b>«Аукцион»</b> — ставка, возможен ва-банк. <b>Финал</b> — темы, ставки, один вопрос.</p>
        <p className="qm-small">Источник: <a className="qm-link" href="https://kknights.com/posts/3723-svoia-igra-instruktsiia-dlia-igroka" target="_blank" rel="noreferrer">kknights.com</a></p>
      </section>

      <section className="qm-card">
        <div className="qm-eyebrow">Сессия</div>
        <h2 className="qm-title">Как подключиться</h2>
        <ol style={{ lineHeight: 1.9 }}>
          <li>Ведущий создаёт сессию и вводит участников.</li>
          <li>Игроки открывают страницу «Присоединиться» и вводят код.</li>
          <li>Каждый выбирает своё имя и нажимает ответы со своего устройства.</li>
          <li>Аккаунт игрокам не нужен.</li>
        </ol>
      </section>
    </div>
  );
}

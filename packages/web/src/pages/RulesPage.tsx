import { Link } from 'react-router-dom';

export default function RulesPage() {
  return (
    <div>
      <div className="qm-page-head">
        <div>
          <div className="qm-eyebrow">Свод правил</div>
          <h1 className="qm-title">Как играть</h1>
          <p className="qm-subtitle">Кратко о четырёх форматах и о том, как работает сессия.</p>
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

      <section className="qm-card" id="melody">
        <div className="qm-eyebrow">Формат 3</div>
        <h2 className="qm-title">Угадай мелодию</h2>
        <p>Три игрока, три тура и суперигра. Игроки слушают фрагменты без слов и первыми нажимают кнопку.</p>
        <div className="qm-grid qm-grid-4 qm-mt">
          <div className="qm-stat"><b>4</b><span>категории</span></div>
          <div className="qm-stat"><b>16</b><span>«нот» в туре</span></div>
          <div className="qm-stat"><b>3</b><span>очка для финала</span></div>
          <div className="qm-stat"><b>7</b><span>мелодий за 30 с</span></div>
        </div>
        <h3 className="qm-mt">Туры</h3>
        <p className="qm-small">
          <b>1 тур</b> — четыре категории по четыре ноты стоимостью 15–100. Ошибся — пропускаешь две мелодии.<br />
          <b>2 тур</b> — приз растёт каждую секунду, пока звучит музыка. После тура выбывает игрок с меньшим счётом.<br />
          <b>3 тур</b> — ведущий даёт подсказку, игроки торгуются, с трёх–семи нот угадают. Кто первым наберёт 3 очка — в суперигру.<br />
          <b>Суперигра</b> — семь мелодий за 30 секунд. Все семь — бонус к призу.
        </p>
        <p className="qm-small">Источник: <a className="qm-link" href="https://ugadaj-melodiyu.narod.ru/" target="_blank" rel="noreferrer">ugadaj-melodiyu.narod.ru</a></p>
      </section>

      <section className="qm-card" id="quiz">
        <div className="qm-eyebrow">Формат 4</div>
        <h2 className="qm-title">Классический квиз</h2>
        <p>Командная игра в формате паб-квиза: ведущий читает вопросы, команды обсуждают и сдают ответы на бланках.</p>
        <div className="qm-grid qm-grid-4 qm-mt">
          <div className="qm-stat"><b>7</b><span>раундов</span></div>
          <div className="qm-stat"><b>51</b><span>вопрос</span></div>
          <div className="qm-stat"><b>2–8</b><span>человек в команде</span></div>
          <div className="qm-stat"><b>~2 ч</b><span>длится игра</span></div>
        </div>
        <h3 className="qm-mt">Раунды</h3>
        <p className="qm-small">
          <b>Разминка</b> — 7 вопросов с четырьмя вариантами.<br />
          <b>Бинго</b> — 3 темы по 3 письменных вопроса.<br />
          <b>Пошумим</b> — 7 аудио- и медиавопросов.<br />
          <b>Секундочку</b> — блиц из 12 коротких вопросов.<br />
          <b>За кулисами</b> — 5 заданий и общий вопрос с бонусом.<br />
          <b>Папарам</b> — 4 задачи: из 10 элементов составить 5 пар.<br />
          <b>Казино</b> — 6 вопросов на логику со ставками: верно — плюс ставка, неверно — минус.
        </p>
        <p className="qm-small">Источник: <a className="qm-link" href="https://squiz.ru/pravila-kviza" target="_blank" rel="noreferrer">squiz.ru/pravila-kviza</a></p>
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

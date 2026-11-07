import { Link } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { IconBrain, IconBulb, IconController, IconTrophy } from '../components/icons';

export default function HomePage() {
  const { user } = useAuth();

  return (
    <div>
      <section className="qm-card qm-hero">
        <div className="qm-hero-board" />
        <div className="qm-eyebrow" style={{ color: '#e6c458' }}>Конструктор викторин</div>
        <h1>Собери свою игру</h1>
        <p>
          Создавай вопросы, запускай сессии и играй с друзьями в «Кто хочет стать миллионером?»
          и «Свою игру». Участникам не нужен аккаунт — только код комнаты.
        </p>
        <div className="qm-hero-actions">
          <Link className="qm-btn qm-btn-gold qm-btn-lg" to={user ? '/cabinet' : '/register'}>
            {user ? 'Мои игры' : 'Создать игру'}
          </Link>
          <Link className="qm-btn qm-btn-primary qm-btn-lg" to="/join">
            Присоединиться по коду
          </Link>
        </div>
      </section>

      <section className="qm-grid qm-grid-2 qm-mt-lg">
        <div className="qm-card qm-feature">
          <div className="icon"><IconBulb size={32} /></div>
          <h2>Кто хочет стать миллионером?</h2>
          <p>15 вопросов, лестница сумм, несгораемые рубежи и три подсказки. Каждый участник проходит свою игру.</p>
          <p className="qm-mt"><Link className="qm-link" to="/rules#millionaire">Правила →</Link></p>
        </div>
        <div className="qm-card qm-feature">
          <div className="icon"><IconBrain size={32} /></div>
          <h2>Своя игра</h2>
          <p>Табло с темами и стоимостями, раунды, «Кот в мешке», «Аукцион» и финал. Команды выбирают вопрос и отвечают.</p>
          <p className="qm-mt"><Link className="qm-link" to="/rules#svoya">Правила →</Link></p>
        </div>
        <div className="qm-card qm-feature">
          <div className="icon"><IconController size={32} /></div>
          <h2>Сессии без регистрации</h2>
          <p>Ведущий вводит участников, раздаёт код — игроки открывают ссылку, выбирают своё имя и нажимают ответы.</p>
        </div>
        <div className="qm-card qm-feature">
          <div className="icon"><IconTrophy size={32} /></div>
          <h2>Результаты и рейтинг</h2>
          <p>Очки считаются автоматически: выигрыш по лестнице или счёт команд на табло. Победитель виден сразу.</p>
        </div>
      </section>

      <section className="qm-card qm-mt-lg">
        <div className="qm-eyebrow">Как это работает</div>
        <div className="qm-grid qm-grid-3 qm-mt">
          <div className="qm-stat"><b>1</b><span>Создай игру</span></div>
          <div className="qm-stat"><b>2</b><span>Добавь вопросы</span></div>
          <div className="qm-stat"><b>3</b><span>Запусти сессию</span></div>
        </div>
        <p className="qm-small qm-mt">
          Для авторов нужен аккаунт. Игрокам — нет: достаточно кода комнаты.
        </p>
      </section>
    </div>
  );
}

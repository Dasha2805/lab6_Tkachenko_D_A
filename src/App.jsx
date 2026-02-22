import { useState, useEffect } from 'react';
import axios from 'axios';

// Настройка API
const API_URL = 'http://localhost:8000/api/v1';
const api = axios.create({ baseURL: API_URL });

function App() {
  const [page, setPage] = useState('home');
  const [selectedNews, setSelectedNews] = useState(null);
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newComment, setNewComment] = useState('');
  const [news, setNews] = useState([]);
  const [comments, setComments] = useState({});
  const [loading, setLoading] = useState(true);
  const [apiAvailable, setApiAvailable] = useState(true);

  // Проверяем доступность API и загружаем данные
  useEffect(() => {
    const fetchData = async () => {
      try {
        const newsRes = await api.get('/news/');
        setNews(newsRes.data);
        
        // Загружаем комментарии для каждой новости (упрощенно)
        const commentsData = {};
        for (const item of newsRes.data) {
          try {
            const commentsRes = await api.get('/comments/', { params: { news_id: item.id } });
            commentsData[item.id] = commentsRes.data;
          } catch (e) {
            commentsData[item.id] = [];
          }
        }
        setComments(commentsData);
        setApiAvailable(true);
      } catch (error) {
        console.log('API недоступен, используем моковые данные');
        setApiAvailable(false);
        // Моковые данные на случай, если API не работает
        setNews([
          { id: 1, title: 'Запуск космического корабля', content: 'Текст новости...', author: 'Автор', date: '2024-02-22', authorId: 2 },
          { id: 2, title: 'Открытие выставки', content: 'Текст новости...', author: 'Админ', date: '2024-02-21', authorId: 1 },
        ]);
        setComments({
          1: [{ id: 1, text: 'Комментарий', author: 'User', authorId: 3 }],
          2: []
        });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const formData = new URLSearchParams();
      formData.append('username', email);
      formData.append('password', password);

      const res = await api.post('/auth/login', formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });
      
      localStorage.setItem('token', res.data.access_token);
      setUser(res.data.user);
      setPage('home');
    } catch (error) {
      // Если API не работает - имитируем вход
      if (!apiAvailable) {
        if (email === 'admin@example.com') {
          setUser({ id: 1, name: 'Админ', email, role: 'admin' });
        } else if (email === 'author@example.com') {
          setUser({ id: 2, name: 'Автор', email, role: 'verified_author' });
        } else {
          setUser({ id: 3, name: 'Пользователь', email, role: 'user' });
        }
        setPage('home');
      } else {
        alert('Ошибка входа. Попробуйте admin@example.com');
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const handleAddComment = () => {
    if (!newComment.trim() || !user) return;
    const newId = Date.now();
    setComments({
      ...comments,
      [selectedNews.id]: [
        ...(comments[selectedNews.id] || []),
        { id: newId, text: newComment, author: user.name, authorId: user.id }
      ]
    });
    setNewComment('');
  };

  // Страница входа
  if (page === 'login') {
    return (
      <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px', background: '#f5f5f5', borderRadius: '8px' }}>
        <h2 style={{ textAlign: 'center' }}>Вход в систему</h2>
        <form onSubmit={handleLogin}>
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} 
            style={{ width: '100%', padding: '10px', margin: '10px 0', borderRadius: '4px' }} required />
          <input type="password" placeholder="Пароль" value={password} onChange={(e) => setPassword(e.target.value)} 
            style={{ width: '100%', padding: '10px', margin: '10px 0', borderRadius: '4px' }} required />
          <button type="submit" style={{ width: '100%', padding: '10px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            Войти
          </button>
        </form>
        <div style={{ marginTop: '20px', padding: '15px', background: '#e9ecef', borderRadius: '4px' }}>
          <p><strong>Тестовые аккаунты:</strong></p>
          <p>admin@example.com / любой пароль</p>
          <p>author@example.com / любой пароль</p>
          <p>user@example.com / любой пароль</p>
          <p><small>Статус API: {apiAvailable ? '✅ Доступен' : '⚠️ Используются мок-данные'}</small></p>
        </div>
      </div>
    );
  }

  // Страница новости
  if (page === 'news' && selectedNews) {
    return (
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
        <button onClick={() => setPage('home')} style={{ marginBottom: '20px', padding: '8px 16px', cursor: 'pointer' }}>← Назад</button>
        <h1>{selectedNews.title}</h1>
        <p><strong>Автор:</strong> {selectedNews.author}</p>
        <p><strong>Дата:</strong> {selectedNews.date}</p>
        <div style={{ background: '#f9f9f9', padding: '20px', borderRadius: '8px', margin: '20px 0' }}>
          {selectedNews.content}
        </div>

        {user?.role === 'admin' && (
          <button style={{ background: '#dc3545', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '4px', cursor: 'pointer', marginBottom: '20px' }}>
            Удалить новость
          </button>
        )}

        <h3>Комментарии ({comments[selectedNews.id]?.length || 0})</h3>
        {comments[selectedNews.id]?.map(comment => (
          <div key={comment.id} style={{ border: '1px solid #ddd', padding: '10px', margin: '10px 0', borderRadius: '4px' }}>
            <p>{comment.text}</p>
            <small>Автор: {comment.author}</small>
          </div>
        ))}

        {user ? (
          <div style={{ marginTop: '20px' }}>
            <textarea value={newComment} onChange={(e) => setNewComment(e.target.value)} 
              placeholder="Комментарий..." style={{ width: '100%', padding: '10px', minHeight: '80px', marginBottom: '10px' }} />
            <button onClick={handleAddComment} style={{ padding: '10px 20px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
              Отправить
            </button>
          </div>
        ) : (
          <p><button onClick={() => setPage('login')} style={{ background: 'none', border: 'none', color: '#007bff', textDecoration: 'underline', cursor: 'pointer' }}>Войдите</button></p>
        )}
      </div>
    );
  }

  if (loading) return <div style={{ padding: '20px' }}>Загрузка...</div>;

  // Главная страница
  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1>📰 Новостной портал</h1>
        <div>
          {user ? (
            <div>
              <span>{user.name} ({user.role}) </span>
              <button onClick={handleLogout} style={{ marginLeft: '10px', padding: '5px 10px' }}>Выйти</button>
            </div>
          ) : (
            <button onClick={() => setPage('login')} style={{ padding: '8px 16px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
              Войти
            </button>
          )}
        </div>
      </div>

      {user?.role === 'verified_author' && (
        <button style={{ marginBottom: '20px', padding: '10px 20px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          + Создать новость
        </button>
      )}

      <div style={{ display: 'grid', gap: '20px' }}>
        {news.map(item => (
          <div key={item.id} onClick={() => { setSelectedNews(item); setPage('news'); }}
            style={{ border: '1px solid #ddd', padding: '20px', cursor: 'pointer', borderRadius: '8px' }}>
            <h2>{item.title}</h2>
            <p>Автор: {item.author}</p>
            <p>Дата: {item.date}</p>
          </div>
        ))}
      </div>
      
      <div style={{ marginTop: '20px', padding: '10px', background: '#f0f0f0', borderRadius: '4px' }}>
        <small>Статус API: {apiAvailable ? '✅ Реальные данные' : '⚠️ Демо-режим (API недоступен)'}</small>
      </div>
    </div>
  );
}

export default App;

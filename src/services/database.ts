import Database from '@tauri-apps/plugin-sql';

let db: Database | null = null;

export async function initDatabase(): Promise<void> {
  try {
    db = await Database.load('sqlite:popomomo.db');
  } catch (error) {
    // Tauriが利用できない環境ではlocalStorageを使用（開発環境では正常）
    return;
  }
  
  // テーブルの作成
  await db.execute(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  await db.execute(`
    CREATE TABLE IF NOT EXISTS work_logs (
      id TEXT PRIMARY KEY,
      category_id INTEGER,
      task TEXT NOT NULL,
      mode TEXT NOT NULL,
      duration INTEGER NOT NULL,
      completed BOOLEAN NOT NULL,
      timestamp DATETIME NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories(id)
    )
  `);
  
  await db.execute(`
    CREATE TABLE IF NOT EXISTS pomodoro_plans (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      steps TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  await db.execute(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `);
  
  // デフォルトカテゴリの挿入
  const defaultCategories = ['実装', '設計', '会議', 'レビュー', 'ドキュメント', 'その他'];
  for (const category of defaultCategories) {
    await db.execute(
      'INSERT OR IGNORE INTO categories (name) VALUES (?)',
      [category]
    );
  }
}

export async function getDatabase(): Promise<Database | null> {
  if (!db) {
    await initDatabase();
  }
  return db;
}

// カテゴリ関連
export interface Category {
  id: number;
  name: string;
  created_at: string;
}

export async function getCategories(): Promise<Category[]> {
  const database = await getDatabase();
  if (!database) {
    // フォールバック: localStorageから読み込み、なければデフォルトカテゴリ
    const stored = localStorage.getItem('popomomo-categories');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        // JSON解析エラーの場合はリセット
      }
    }
    
    const defaultCategories = [
      { id: 1, name: '実装', created_at: new Date().toISOString() },
      { id: 2, name: '設計', created_at: new Date().toISOString() },
      { id: 3, name: '会議', created_at: new Date().toISOString() },
      { id: 4, name: 'レビュー', created_at: new Date().toISOString() },
      { id: 5, name: 'ドキュメント', created_at: new Date().toISOString() },
      { id: 6, name: 'その他', created_at: new Date().toISOString() }
    ];
    
    // デフォルトカテゴリをlocalStorageに保存
    localStorage.setItem('popomomo-categories', JSON.stringify(defaultCategories));
    return defaultCategories;
  }
  const result = await database.select<Category[]>(
    'SELECT * FROM categories ORDER BY name'
  );
  return result;
}

export async function addCategory(name: string): Promise<void> {
  try {
    const database = await getDatabase();
    if (!database) {
      // フォールバック: localStorageに保存
      const categories = JSON.parse(localStorage.getItem('popomomo-categories') || '[]');
      const newCategory = { id: Date.now(), name, created_at: new Date().toISOString() };
      categories.push(newCategory);
      localStorage.setItem('popomomo-categories', JSON.stringify(categories));
      return;
    }
    
    // INSERT OR IGNOREを使用して重複エラーを回避
    await database.execute(
      'INSERT OR IGNORE INTO categories (name) VALUES (?)',
      [name]
    );
    
  } catch (error) {
    console.error('カテゴリ追加エラー:', error);
    throw error;
  }
}

export async function updateCategory(id: number, name: string): Promise<void> {
  const database = await getDatabase();
  if (!database) {
    console.warn('database.ts: データベース未接続、updateCategory処理をスキップ');
    return;
  }
  await database.execute(
    'UPDATE categories SET name = ? WHERE id = ?',
    [name, id]
  );
}

export async function deleteCategory(id: number): Promise<void> {
  const database = await getDatabase();
  if (!database) {
    console.warn('database.ts: データベース未接続、deleteCategory処理をスキップ');
    return;
  }
  // その他カテゴリのIDを取得
  const otherCategory = await database.select<Category[]>(
    'SELECT id FROM categories WHERE name = ?',
    ['その他']
  );
  
  if (otherCategory.length > 0) {
    // 削除するカテゴリの作業ログを「その他」に移動
    await database.execute(
      'UPDATE work_logs SET category_id = ? WHERE category_id = ?',
      [otherCategory[0].id, id]
    );
  }
  
  await database.execute(
    'DELETE FROM categories WHERE id = ?',
    [id]
  );
}

// 作業ログ関連
export interface WorkLogDB {
  id: string;
  category_id: number;
  task: string;
  mode: string;
  duration: number;
  completed: boolean;
  timestamp: string;
}

export async function getWorkLogs(): Promise<WorkLogDB[]> {
  const database = await getDatabase();
  if (!database) {
    return [];
  }
  const result = await database.select<WorkLogDB[]>(
    'SELECT * FROM work_logs ORDER BY timestamp DESC'
  );
  return result;
}

export async function addWorkLog(log: {
  id: string;
  category: string;
  task: string;
  mode: string;
  duration: number;
  completed: boolean;
  timestamp: Date;
}): Promise<void> {
  const database = await getDatabase();
  if (!database) {
    return;
  }
  
  // カテゴリ名からIDを取得
  const category = await database.select<Category[]>(
    'SELECT id FROM categories WHERE name = ?',
    [log.category]
  );
  
  if (category.length > 0) {
    await database.execute(
      `INSERT INTO work_logs (id, category_id, task, mode, duration, completed, timestamp) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        log.id,
        category[0].id,
        log.task,
        log.mode,
        log.duration,
        log.completed,
        log.timestamp.toISOString()
      ]
    );
  }
}

export async function deleteWorkLog(id: string): Promise<void> {
  const database = await getDatabase();
  if (!database) return;
  await database.execute(
    'DELETE FROM work_logs WHERE id = ?',
    [id]
  );
}

// ポモドーロプラン関連
export interface PomodoroPlanDB {
  id: string;
  name: string;
  steps: string;
}

export async function getPomodoroPlan(): Promise<PomodoroPlanDB[]> {
  const database = await getDatabase();
  if (!database) return [];
  const result = await database.select<PomodoroPlanDB[]>(
    'SELECT * FROM pomodoro_plans ORDER BY created_at DESC'
  );
  return result;
}

export async function addPomodoroPlan(plan: {
  id: string;
  name: string;
  steps: any[];
}): Promise<void> {
  const database = await getDatabase();
  if (!database) return;
  await database.execute(
    'INSERT INTO pomodoro_plans (id, name, steps) VALUES (?, ?, ?)',
    [plan.id, plan.name, JSON.stringify(plan.steps)]
  );
}

export async function deletePomodoroPlan(id: string): Promise<void> {
  const database = await getDatabase();
  if (!database) return;
  await database.execute(
    'DELETE FROM pomodoro_plans WHERE id = ?',
    [id]
  );
}

// 設定関連
export async function getSetting(key: string): Promise<string | null> {
  const database = await getDatabase();
  if (!database) return null;
  const result = await database.select<{ value: string }[]>(
    'SELECT value FROM settings WHERE key = ?',
    [key]
  );
  return result.length > 0 ? result[0].value : null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  const database = await getDatabase();
  if (!database) return;
  await database.execute(
    'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
    [key, value]
  );
}

// データ移行関数
export async function migrateFromLocalStorage(): Promise<void> {
  const database = await getDatabase();
  if (!database) return;
  
  // 既存のデータをチェック
  const existingLogs = await database.select<{ count: number }[]>(
    'SELECT COUNT(*) as count FROM work_logs'
  );
  
  // すでにデータがある場合は移行しない
  if (existingLogs[0].count > 0) {
    return;
  }
  
  // LocalStorageからデータを取得
  const savedLogs = localStorage.getItem('popomomo-logs');
  if (savedLogs) {
    const logs = JSON.parse(savedLogs);
    for (const log of logs) {
      await addWorkLog({
        ...log,
        timestamp: new Date(log.timestamp)
      });
    }
  }
  
  const savedPlans = localStorage.getItem('popomomo-plans');
  if (savedPlans) {
    const plans = JSON.parse(savedPlans);
    for (const plan of plans) {
      await addPomodoroPlan(plan);
    }
  }
  
  const savedTheme = localStorage.getItem('popomomo-theme');
  if (savedTheme) {
    await setSetting('theme', savedTheme);
  }
}
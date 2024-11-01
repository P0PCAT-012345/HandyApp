// src/translation.ts

interface Translations {
    [key: string]: {
      en: string;
      jp: string;
    };
  }
  
  export const translations: Translations = {
    'click_to_start_translation': {
      en: 'Click the screen to start translation',
      jp: '画面をクリックすると翻訳が始まります',
    },
    'click_to_start_recording': {
      en: 'Click the screen to start recording, and opening your mouth will stop',
      jp: '画面をクリックして録画が始まり、口を開けると終了します',
    },
    'enter_sign_name': {
      en: 'Enter the name of the sign language',
      jp: '手話の名前を入力してください',
    },
    'save': {
      en: 'Save',
      jp: '保存する',
    },
    'cancel': {
      en: 'Cancel',
      jp: 'キャンセル',
    },
    'no_saved_signs': {
      en: 'No saved signs.',
      jp: '保存された手話がありません。',
    },
    'search_placeholder': {
      en: 'Search...',
      jp: '検索...',
    },
    'logout': {
      en: 'Logout',
      jp: 'ログアウト',
    },
    'settings': {
      en: 'Settings',
      jp: '設定',
    },
    'dark_mode': {
      en: 'Dark Mode',
      jp: 'ダークモード',
    },
    'light_mode': {
      en: 'Light Mode',
      jp: 'ライトモード',
    },
    'language': {
      en: 'Language',
      jp: '言語',
    },
    'english': {
      en: 'English',
      jp: '英語',
    },
    'japanese': {
      en: 'Japanese',
      jp: '日本語',
    },
    'translate': {
      en: 'Translate',
      jp: '翻訳',
    },
    'record': {
      en: 'Record',
      jp: '録画',
    },
    'files': {
      en: 'Files',
      jp: 'ファイル',
    },
    'documentation': {
      en: 'Documentation',
      jp: 'ドキュメント',
    },
    'upload': {
      en: 'Upload',
      jp: 'アップロード',
    },
    'download': {
      en: 'Download',
      jp: 'ダウンロード',
    },
    'delete': {
      en: 'Delete',
      jp: '削除する',
    },
    'save_recording': {
      en: 'Save Recording',
      jp: '録画を保存',
    },
    'cancel_saving': {
      en: 'Cancel Saving',
      jp: '保存をキャンセル',
    },
    'preview': {
      en: 'Preview',
      jp: 'プレビュー',
    },
    'close': {
      en: 'Close',
      jp: '閉じる',
    },
    'login': {
      en: 'Login',
      jp: 'ログイン',
    },
    'signup': {
      en: 'Sign Up',
      jp: 'サインアップ',
    },
    'username': {
      en: 'Username',
      jp: 'ユーザー名',
    },
    'password': {
      en: 'Password',
      jp: 'パスワード',
    },
    'remember_me': {
      en: 'Remember Me',
      jp: 'ログイン状態を保持',
    },
    'no_account': {
      en: "Don't have an account? Sign Up",
      jp: 'アカウントをお持ちでないですか？サインアップ',
    },
    'have_account': {
      en: 'Already have an account? Login',
      jp: '既にアカウントをお持ちですか？ログイン',
    },
    'login_error': {
      en: 'Login failed. Please check your credentials.',
      jp: 'ログインに失敗しました。資格情報を確認してください。',
    },
    'signup_error': {
      en: 'Sign up failed. Please try again.',
      jp: 'サインアップに失敗しました。もう一度お試しください。',
    },
    'saved_files': {
    en: 'Saved Files',
    jp: '保存されたファイル',
    },
    'search_folders': {
        en: 'Search Folders',
        jp: 'フォルダ検索',
    },
    'delete_selected': {
        en: 'Delete Selected',
        jp: '選択したものを削除',
    },
    'add_description': {
        en: 'Click to add description...',
        jp: '説明を追加するにはクリック...',
    },
    'browser_not_support': {
        en: 'Your browser does not support the video tag.',
        jp: 'お使いのブラウザはビデオタグをサポートしていません。',
    },
  };
  
  export const t = (key: string, language: 'en' | 'jp') => {
    return translations[key]?.[language] || key;
  };
  
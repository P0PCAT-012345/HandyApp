// src/i18n.ts

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      // Existing translations...
      "Settings": "Settings",
      "Theme": "Theme",
      "Language": "Language",
      "Camera": "Camera",
      "Toggle Theme": "Toggle Theme",
      "Select Language": "Select Language",
      "Select Camera": "Select Camera",
      "No Cameras Found": "No Cameras Found",
      "Dashboard": "Dashboard",
      "Record": "Record",
      "Files": "Files",
      "Documentation": "Documentation",
      "Logout": "Logout",
      "Translate": "Translate",
      "Upload": "Upload",
      "Save": "Save",
      "Cancel": "Cancel",
      "Record Video": "Record Video",
      "Play Video": "Play Video",
      "Enter Sign Name": "Enter Sign Name",
      "Record Name": "Record Name",
      "Save Recording": "Save Recording",
      "Cancel Saving": "Cancel Saving",
      "Translation Output": "Translation Output",
      "Failed to parse server response.": "Failed to parse server response.",
      "Error": "Error",
      "No Saved Signs": "No Saved Signs",
      "Preview": "Preview",
      "Close": "Close",
      "Your browser does not support the video tag.": "Your browser does not support the video tag.",
      "Are you sure you want to delete it?": "Are you sure you want to delete it?",
      "Upload feature is currently not implemented.": "Upload feature is currently not implemented.",
      "Close Sidebar": "Close Sidebar",
      "Open Sidebar": "Open Sidebar",
      "Handy": "Handy",
      "Handy Website": "Handy Website",
      "Sign Language": "Sign Language",
      "Saved Sign Language": "Saved Sign Language",

      // New Instruction Translations
      "Start Recording Instruction": "Click on the screen to start recording. The text will show as a subtitle below.",
      "Start Signing Instruction": "Click on the screen to start signing. The blur will disappear so you can sign, and the text will show as a subtitle below.",
      "Copy to Clipboard": "Copy to Clipboard",
      "Copied!": "Copied!",
      "Instructions": "Instructions"
    }
  },
  ja: {
    translation: {
      // Existing translations...
      "Settings": "設定",
      "Theme": "テーマ",
      "Language": "言語",
      "Camera": "カメラ",
      "Toggle Theme": "テーマを切り替える",
      "Select Language": "言語を選択",
      "Select Camera": "カメラを選択",
      "No Cameras Found": "カメラが見つかりません",
      "Dashboard": "ダッシュボード",
      "Record": "録画",
      "Files": "ファイル",
      "Documentation": "ドキュメント",
      "Logout": "ログアウト",
      "Translate": "翻訳",
      "Upload": "アップロード",
      "Save": "保存",
      "Cancel": "キャンセル",
      "Record Video": "ビデオを録画",
      "Play Video": "ビデオを再生",
      "Enter Sign Name": "手話の名前を入力してください",
      "Record Name": "録画名",
      "Save Recording": "録画を保存",
      "Cancel Saving": "保存をキャンセル",
      "Translation Output": "翻訳出力",
      "Failed to parse server response.": "サーバーの応答を解析できませんでした。",
      "Error": "エラー",
      "No Saved Signs": "保存された手話がありません。",
      "Preview": "プレビュー",
      "Close": "閉じる",
      "Your browser does not support the video tag.": "お使いのブラウザはビデオタグをサポートしていません。",
      "Are you sure you want to delete it?": "これを削除してもよろしいですか？",
      "Upload feature is currently not implemented.": "アップロード機能は現在実装されていません。",
      "Close Sidebar": "サイドバーを閉じる",
      "Open Sidebar": "サイドバーを開く",
      "Handy": "Handy",
      "Handy Website": "Handy ウェブサイト",
      "Sign Language": "手話",
      "Saved Sign Language": "保存された手話",

      // New Instruction Translations
      "Start Recording Instruction": "録画を開始するには画面をクリックしてください。字幕としてテキストが下に表示されます。",
      "Start Signing Instruction": "手話を開始するには画面をクリックしてください。ぼかしが消えて手話ができるようになり、字幕としてテキストが下に表示されます。",
      "Copy to Clipboard": "クリップボードにコピー",
      "Copied!": "コピーしました！",
      "Instructions": "指示"
    }
  },
  // Add more languages as needed
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: localStorage.getItem('language') || 'en', // Default language
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;

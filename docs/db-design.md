# テーブル定義書

## users

※ Supabase Authを使用

| カラム名 　 | 型          | NULL | 説明 　                  |
| ----------- | ----------- | ---- | ------------------------ |
| id          | uuid        | NO   | 主キー（auth.users連携） |
| name        | varchar(50) | NO   | ユーザー名 　            |
| avatar_url  | text        | YES  | プロフィール画像 　      |
| created_at  | timestamp   | NO   | 作成日時 　              |
| updated_at  | timestamp   | NO   | 更新日時 　              |

補足：

- メールアドレスは `auth.users` を参照する前提（`public.users` には保持しない）

---

## teams

| カラム名     | 型          | NULL | 説明                       |
| ------------ | ----------- | ---- | -------------------------- |
| id           | uuid        | NO   | 主キー（チーム/部屋）     |
| project_name | varchar(80) | NO   | 部屋名                     |
| team_code    | varchar(20) | NO   | チーム参加コード           |
| members_num  | integer     | NO   | 所属人数（キャッシュ用途） |
| created_at   | timestamp   | NO   | 作成日時                   |

## 制約

- project_name：
  - 80文字以内

- team_code：
  - UNIQUE（重複不可）
  - 英数字のみ想定
  - 20文字以内

## インデックス

- project_name（部分一致検索をするなら別途検討）
- team_code（チーム参加時検索用）

---

## team_members

| カラム名  | 型        | NULL | 説明        |
| --------- | --------- | ---- | ----------- |
| id        | uuid      | NO   | 主キー      |
| team_id   | uuid      | NO   | teams.id    |
| user_id   | uuid      | NO   | users.id    |
| joined_at | timestamp | NO   | 参加日時    |

## 制約

- UNIQUE(team_id, user_id)
（同じユーザーは同じチームに重複参加不可）

## 外部キー

- team_id → teams.id（ON DELETE CASCADE）
- user_id → users.id（ON DELETE CASCADE）

## インデックス

- team_id
- user_id
- (team_id, user_id)（複合インデックス）

---

## daily_reports

| カラム名    | 型          | NULL | 説明 　   |
| ----------- | ----------- | ---- | --------- |
| id          | uuid        | NO   | 主キー 　 |
| team_id     | uuid        | NO   | teams.id  |
| user_id     | uuid        | NO   | users.id  |
| title       | varchar(50) | NO   | タイトル  |
| report_date | date        | NO   | 日報日付  |
| category    | varchar(20) | NO   | カテゴリ  |
| visibility  | varchar(10) | NO   | 公開範囲  |
| content     | text        | NO   | 本文      |
| created_at  | timestamp   | NO   | 作成日時  |
| updated_at  | timestamp   | NO   | 更新日時  |

## 制約

title：

- 50文字以内

content：

- 2000文字以内

category：

- CHECK制約想定（開発・会議・その他）

visibility：

- CHECK制約想定（team / global）
- team：同一チーム（team_id）所属者のみ閲覧可能
- global：全ログインユーザーが閲覧可能

team_id：

- team_members に自分が所属している team_id のみ登録可能（RLSで担保）

## 外部キー

- team_id → teams.id（ON DELETE RESTRICT）
- user_id → users.id（ON DELETE RESTRICT）

---

## comments

| カラム名   | 型        | NULL | 説明             |
| ---------- | --------- | ---- | ---------------- |
| id         | uuid      | NO   | 主キー           |
| report_id  | uuid      | NO   | daily_reports.id |
| user_id    | uuid      | NO   | users.id         |
| content    | text      | NO   | コメント         |
| created_at | timestamp | NO   | 作成日時         |

## 制約

content：

- 500文字以内

## 外部キー

- report_id → daily_reports.id（ON DELETE CASCADE）
- user_id → users.id（ON DELETE RESTRICT）

---

# リレーション

## users → teams

1 user : many teams

外部キー：
teams.created_by

## teams → team_members

1 team : many members

外部キー：
team_members.team_id

---

## users → team_members

1 user : many memberships

外部キー：
team_members.user_id

---

## users → daily_reports

1 user : many reports

外部キー：
daily_reports.user_id

---

## teams → daily_reports

1 team : many reports

外部キー：
daily_reports.team_id

---

## users → comments

1 user : many comments

外部キー：
comments.user_id

---

## daily_reports → comments

1 report : many comments

外部キー：
comments.report_id

---

# インデックス

## daily_reports

追加推奨：

- team_id
- user_id
- report_date
- created_at
- visibility

複合（検索・一覧向け）：

- (team_id, created_at)
- (team_id, report_date)
- (team_id, user_id, report_date)
- (visibility, created_at)

## comments

追加推奨：

report_id  
user_id

---

# セキュリティ設計（RLS）

前提：

- 「同一プロジェクト（team）内のユーザーのみ閲覧可能」
- `team_members` への所属が閲覧権限の根拠

## teams

SELECT：
自分が所属する team のみ

INSERT：
ログインユーザーのみ（作成後に作成者を team_members に追加）

UPDATE / DELETE：
必要なら role 等で別途設計（現状はスコープ外）

---

## team_members

SELECT：
自分が所属する team のメンバーのみ

INSERT ：
有効なteam_codeを入力し、認証済みユーザーのみ

DELETE：
脱退の仕様に合わせて別途設計（現状はスコープ外）

---

## daily_reports

SELECT：
visibility = global の日報、または自分が所属する team の日報のみ

INSERT：
auth.uid() = user_id かつ team_id の所属者のみ

UPDATE：
auth.uid() = user_id

DELETE：
auth.uid() = user_id

---

## comments

SELECT：
閲覧可能な日報（daily_reports SELECT条件を満たす）へのコメントのみ

INSERT：
auth.uid() = user_id かつ report_id が閲覧可能な日報

DELETE：
auth.uid() = user_id

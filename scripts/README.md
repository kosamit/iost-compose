# liquid api

## 環境準備
ローカルでテスト用のプライベートネットワークを作成（止めると消えるから注意）

```sh
npm run start
```

ローカルのプライベートネットワークをストップさせる（止めると消えるから注意）

```sh
npm run stop
```

adminアカウントが自分で gas\_pledge と ram\_buy を行う

```sh
npm run init
```

adminアカウントから指定したアカウント名でsignupを行う．作成したアカウントの秘密鍵は config/account.json に記録される．

```sh
npm run signup <<account_id>>
```

コントラクトコードを最小化する．

```sh
npm run minify
```

abiファイルを作成する．

```sh
npm run compile 
```

コントラクトをデプロイする．（コントラクトのアドレスは config/contract.json に自動で記録される．）

```sh
npm run publish
```
コントラクトをアップデートする．

```sh
npm run update
```

## テスト

テスト用アカウントの用意

```sh
node api/test/sign_up.js
```

コントラクトのデプロイ（config/contract.jsonに書き込まれるので注意）

```sh
npm run publish
```

投票テストメンバーの参加（1tx毎にgasが185程上がっていくのが確認できる）

```sh
node api/test/join.js
```

テスト用にランダムに直接投票や委譲投票を行う．パラメーター設定は自動で行う．
コンソールの最初と最後に "tvid\_~~~" が出力されるが，コレがテスト用にランダム生成された voting_id である．表示されるログは実際に api/vote.js を実行したものとは違う点は注意．（gasはほとんど変わらないことが確認できる）

```sh
node api/test/vote.js
```

全メンバーの投票終了1分後以内に締め切りが来るように時間設定されているので，少し待ってから投票を終了する．（最もgasが高い．これが400万を超えるとキャパオーバー．現状500人で50万前後）

```sh
node api/test/finish.js <<voting_id>>
```

集計結果は，（テストのときは，可視性を重んじて JSON.stringify 処理をしていないことに注意）

```sh
node api/test/aggregate <<voting_id>>
```

## 呼び出し用

json文字列がコンソール上に出力される．
status が success か failed でトランザクションの成功を判断．


### アカウント作成

```sh
node api/signup.js <<new_account_id>>
# 成功時例
{"status":"success","secret_key":"4RcYvVDUC7ji7VFPdYZvyogHegfmLNVqhyeZNRcegHYumnn7p64jCafocqXu6Kqo2GZpdHmJzG39EMyzgi9D9Ae5"}
# 失敗時例
{"status":"failed","secret_key":"Y5hdcsterAATq4qrwhZYJDQ3thLooCnERGqddoX3DFtwRAyeTsvv91urJWEbJAEuvro5gu2AGYHiEy3qdCuhcci"}

```

### 投票グループに参加
秘密鍵はbase58エンコード形式

```sh
node api/join.js <<account_id>> <<secret_key>> <<name>> <<description>>
```


### 投票グループにAdmin追加

```sh
node api/add_admin.js <<account_id>> <<secret_key>> <<target_iost_id>>
```

### 投票作成

begin: 投票開始時間（マイクロ秒）

end: 終了時間（マイクロ秒）

selection\_list: 選択肢リスト文字列

voter\_turnout: 最低投票率

approval\_rate: 最低支持率

deny\_rate: 最高否認率

```sh
node api/create.js <<account_id>> <<secret_key>> <<voting_id>>  <<begin>> <<end>> <<selection_list>> <<voter_turnout>> <<approval_rate>> <<deny_rate>>
```

voting_idは数字5文字以上



### 直接投票

```sh
node api/vote.js <<account_id>> <<secret_key>> <<voting_id>> <<selection_index>>
```

### 委譲投票

```sh
node api/delegate.js <<account_id>> <<secret_key>> <<voting_id>> <<target_iost_id>>
```

### 投票終了

```sh
node api/finish.js <<account_id>> <<secret_key>> <<voting_id>>
```

### 投票集計

```sh
node api/aggregate.js <<voting_id>>
# レスポンスの例と見方
## rule 元の設定されていたルール
## result 集計結果 
## result.voter_turnout_clear 参加率が基準値以上の場合は true
## result.approval_rate_clear 最大票を集めた選択肢が，最低支持率の基準値を上回っている場合は true
## result.deny_rate_clear 最大否認の基準値を超えずに，通ったら true
## result.decision すべての条件をクリアした場合で，かつ最もサポートされた選択肢が一つに決まった場合のみ表示される．
{"rule":{"selection_list":["yes","no"],"voter_turnout":0.7,"approval_rate":0.5,"config":{"deny_rate":0.3}},"result":{"voter_turnout":0.998003992015968,"voter_turnout_clear":true,"approval_rate":0.5149700598802395,"approval_rate_clear":true,"approval_rate_list":[0.48303393213572854,0.5149700598802395],"deny_rate":0.5149700598802395,"deny_rate_clear":false,"invalid_voter_list":[],"amount":[242,258],"most_supported":[1]}}
```

### エラーコードについては

api/error.jsonを参照してください．

### ログファイルの場所

api/lib/log/tx.log
がトランザクションのログです。
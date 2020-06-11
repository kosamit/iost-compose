# guild-contracts

## src/*.js
スマートコントラクトのソースコードです．

### デプロイ手順

- デプロイはHub.jsから行ってください．他のコントラクトはHubコントラクトのアドレスを参照して初期化されます．
- Liquidは特別にVotingも参照するので，注意してください．
- Hub以外の各コントラクトはフィールドでHubコントラクトのアドレスを持っているので，Hubコントラクトデプロイ後に書き換えてください．初期段階では，AWSにデプロイされている環境を再現しているので注意してください．

```sh
iwallet compile <<contract_name>>.js
```

とすることでabiファイルが生成されます．


```sh
iwallet --gas_limit 4000000 --account <<account_name>> publish <<contract_name>>.js <<contract_name>>.js.abi 
```
でコントラクトのデプロイを行ってください．

## call/*
- call.jsは実際にコントラクト呼び出しをするものです．以下のaccount.jsonとcname.json，src/のabiファイルなどを参照します．

- cname.jsonはコントラクトのアドレスの参照に使います．

- account.jsonはアカウントのIDと秘密鍵を紐付けるのに使います．

- getKey.jsはHubコントラクトで登録されているテーブルのキーを計算するときに使います．Hubコントラクトでは```sha3(JSON.stringify({ subject: subjectName }))```といった形式で値を保存しています．このgetKey.jsは```node getKey.js <<subject or listeners or event>> <<valueName>>```で利用できます．

```sh
node call.js <<account_id>> <<contract_name>>
## 以下はコンソールに従って入力してください．
```

### メンバーシップ発行からプロジェクト作成，通常投票の利用と実行投票での招待，解散までの手順
<!--
1 呼び出しコントラクト: Membership, メソッド: issue, 引数: 認証するIOSTアカウント, ハンドルネーム
-->
#### メンバーシップ発行
```sh
kunroku: call$ node call.js admin Membership
[selection]
can_update issue 
action? issue
[args length require: 2]
arg 0? kosamit
arg 1? kosamit
```

<!--2 呼び出しコントラクト: Project, メソッド: createProject, 引数: プロジェクトのシンボル, 作成者のハンドルネーム, 作成者以外の初期メンバーの配列の文字列, 投票ルール等の設定
-->
#### プロジェクト作成

```sh
kunroku: call$ node call.js kunroku Project
[selection]
can_update notify createProject join 
action? createProject
arg 0? tproj01
arg 1? kunroku
arg 2? ["kosamit"]
arg 3? {"minSupportRate":50,"minVotingRate":80}
```

<!--3 呼び出しコントラクト: Project, メソッド: join, 引数: プロジェクトのシンボル, 参加者のハンドルネーム
-->
#### 初期メンバー参加

```sh
kunroku: call$ node call.js kosamit Project
[selection]
can_update notify createProject join 
action? join
[args length require: 2]
arg 0? tproj01
arg 1? kosamit
```

<!--4 呼び出しコントラクト: Voting, メソッド: create, 引数: プロジェクトのシンボル, 作成者のハンドルネーム, アルゴリズムの選択, 投票のタイトル, 終了時間, 選択肢
-->
#### 通常投票作成・投票・委譲・受託・集計

```sh
kunroku: call$ node call.js kosamit Voting 
[selection]
can_update notify addAlgo create executionCreate aggregate execute 
action? create
[args length require: 6]
arg 0? tproj01
arg 1? kosamit
arg 2? liquid
arg 3? test
arg 4? 1578109921000000000
arg 5? ["abc","def","ghi"]
```
<!--
5 呼び出しコントラクト: LiquidDemocracy, メソッド: vote, 引数: 投票を作成したトランザクションのハッシュ, 投票者のハンドルネーム, 選択-->

```sh
kunroku: call$ node call.js kosamit LiquidDemocracy
[selection]
can_update create vote delegate accept aggregate resultOf cancel 
action? vote
[args length require: 3]
arg 0? Gi6dUNCnRWS6W6kRC1JzDxUfZNuFt5sZtMMYiZ6XqprN
arg 1? kosamit
arg 2? abc
```
<!--
6 呼び出しコントラクト: LiquidDemocracy, メソッド: delegate, 引数: 投票を作成したトランザクションのハッシュ, 投票者のハンドルネーム, 委譲先のハンドルネーム
-->
```sh
kunroku: call$ node call.js kunroku LiquidDemocracy
[selection]
can_update create vote delegate accept aggregate resultOf cancel 
action? delegate
[args length require: 3]
arg 0? Gi6dUNCnRWS6W6kRC1JzDxUfZNuFt5sZtMMYiZ6XqprN
arg 1? kunroku
arg 2? kosamit
```
<!--6 呼び出しコントラクト: LiquidDemocracy, メソッド: accept, 引数: 投票を作成したトランザクションのハッシュ, 委譲先のハンドルネーム
-->
```sh
kunroku: call$ node call.js kosamit LiquidDemocracy
[selection]
can_update create vote delegate accept aggregate resultOf cancel 
action? accept
[args length require: 2]
arg 0? Gi6dUNCnRWS6W6kRC1JzDxUfZNuFt5sZtMMYiZ6XqprN
arg 1? kosamit
```

<!--7 呼び出しコントラクト: Voting, メソッド: aggregate, 引数: プロジェクトのシンボル, 投票を作成したトランザクションのハッシュ
-->
```sh
kunroku: call$ node call.js kosamit Voting
[selection]
can_update notify addAlgo create executionCreate aggregate execute 
action? aggregate
[args length require: 2]
arg 0? tproj01
arg 1? Gi6dUNCnRWS6W6kRC1JzDxUfZNuFt5sZtMMYiZ6XqprN
## トランザクションのreceiptとreturnsに結果がある
## 中略 ##
  receipts:
   [ { func_name:
        'ContractGiu8ZfUdtmjAVbnNXxarYHvjLstDaV26FQdj6SZhn8ff/aggregate',
       content:
        '{"result":["abc"],"info":{"rule":{"minSupportRate":"0","minVotingRate":"0.8"},"member":["kunroku","kosamit"],"choices":["abc","def","ghi"],"vote":{"kosamit":0,"kunroku":0},"delegate":{"kunroku":"kosamit"}}}' } ] }
return: ["abc"]

```

<!--8 呼び出しコントラクト: Voting, メソッド: executionCreate, 引数: プロジェクトのシンボル, 作成者のハンドルネーム, アルゴリズムの選択, 投票のタイトル, 終了時間, 実行アクション, オプション（招待のときはハンドルネーム）
-->
#### 実行投票作成・投票・集計

```sh
kunroku: call$ node call.js kunroku Voting  
[selection]
can_update notify addAlgo create executionCreate aggregate execute 
action? executionCreate
[args length require: 7]
arg 0? tproj01
arg 1? kunroku
arg 2? liquid
arg 3? oka
arg 4? 1578114620000000000
arg 5? invite
arg 6? thin9rypto
```


<!--9 呼び出しコントラクト: LiquidDemocracy, メソッド: vote, 引数: 投票を作成したトランザクションのハッシュ, 投票者のハンドルネーム, 選択
-->
```sh
kunroku: call$ node call.js kosamit LiquidDemocracy
[selection]
can_update create vote delegate accept aggregate resultOf cancel 
action? vote
[args length require: 3]
arg 0? 8AXD5ARvkgsoRcMm7yVMuX8H8yi5Jkb81UPkiX1Vuf1E
arg 1? kosamit
arg 2? yes
```

```sh
kunroku: call$ node call.js kunroku LiquidDemocracy
[selection]
can_update create vote delegate accept aggregate resultOf cancel 
action? vote
[args length require: 3]
arg 0? 8AXD5ARvkgsoRcMm7yVMuX8H8yi5Jkb81UPkiX1Vuf1E
arg 1? kunroku
arg 2? yes
```

```sh
kunroku: call$ node call.js kunroku Voting
[selection]
can_update notify addAlgo create executionCreate aggregate execute 
action? aggregate
[args length require: 2]
arg 0? tproj01
arg 1? 8AXD5ARvkgsoRcMm7yVMuX8H8yi5Jkb81UPkiX1Vuf1E
```

#### 実行投票での決定後の実行

```sh
kunroku: call$ node call.js kosamit Voting
[selection]
can_update notify addAlgo create executionCreate aggregate execute 
action? execute
[args length require: 2]
arg 0? tproj01
arg 1? 8AXD5ARvkgsoRcMm7yVMuX8H8yi5Jkb81UPkiX1Vuf1E
```
#### 招待実行からの参加
```sh
kunroku: call$ node call.js thin9rypto Project
[selection]
can_update notify createProject join 
action? join
[args length require: 2]
arg 0? tproj01
arg 1? thin9rypto
```

### 解散

```sh
kunroku: call$ node call.js kunroku Voting    
[selection]
can_update notify addAlgo create executionCreate aggregate execute 
action? executionCreate
[args length require: 7]
arg 0? tproj01
arg 1? kunroku
arg 2? liquid
arg 3? kaisan
arg 4? 1578115677000000000
arg 5? dissolution
arg 6? {}

## 中略
kunroku: call$ node call.js kunroku LiquidDemocracy
[selection]
can_update create vote delegate accept aggregate resultOf cancel 
action? vote
[args length require: 3]
arg 0? WffodFmDpTHibjJ4GQDvL83XZuEBbUSbDwfNyiPQqWd
arg 1? kunroku
arg 2? yes

## 中略
kunroku: call$ node call.js thin9rypto LiquidDemocracy
[selection]
can_update create vote delegate accept aggregate resultOf cancel 
action? vote
[args length require: 3]
arg 0? WffodFmDpTHibjJ4GQDvL83XZuEBbUSbDwfNyiPQqWd
arg 1? thin9rypto
arg 2? no 

## 中略
kunroku: call$ node call.js kosamit LiquidDemocracy   
[selection]
can_update create vote delegate accept aggregate resultOf cancel 
action? vote
[args length require: 3]
arg 0? WffodFmDpTHibjJ4GQDvL83XZuEBbUSbDwfNyiPQqWd
arg 1? kosamit
arg 2? yes

## 中略
kunroku: call$ node call.js kunroku Voting            
[selection]
can_update notify addAlgo create executionCreate aggregate execute 
action? aggregate
[args length require: 2]
arg 0? tproj01
arg 1? WffodFmDpTHibjJ4GQDvL83XZuEBbUSbDwfNyiPQqWd

## 中略
kunroku: call$ node call.js kunroku Voting
[selection]
can_update notify addAlgo create executionCreate aggregate execute 
action? execute
[args length require: 2]
arg 0? tproj01
arg 1? WffodFmDpTHibjJ4GQDvL83XZuEBbUSbDwfNyiPQqWd

```
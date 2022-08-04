# @chee/imessages

extract imessage chats to json :-)


## Usage

```
npm install -g @chee/imessages
cp ~/Library/Messages/chat.db chat.db
imessages list-handles ./chat.db // prints all the handles
imessages extract ./chat.db +525588888888 Sofia chee > sofia.json
```

### commands

#### extract

extract messages for a handle

```
imessages extract <database> <handle> [name] [me]
```

#### args

| opt      | desc                                                      | required |
|:---------|:----------------------------------------------------------|:---------|
| database | chat.db (found at ~/Library/Messages/chat.db)             | yes      |
| handle   | whose msgs to extract (see [list-handles](#list-handles)) | yes      |
| name     | the name to use for messages sent by them                 | no       |
| me       | the name to use for messages sent by you                  | no       |

#### list-handles

list available handles in a chat.db database

```
imessages extract <database>
```

#### args

| opt      | desc                                          | required |
|:---------|:----------------------------------------------|:---------|
| database | chat.db (found at ~/Library/Messages/chat.db) | yes      |

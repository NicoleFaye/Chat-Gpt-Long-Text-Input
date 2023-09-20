| Command     | Sender        | Receiver      | Fields                                                                                                                  |
|-------------|---------------|---------------|-------------------------------------------------------------------------------------------------------------------------|
| `run`       | Popup Script  | Content Script| `command`, `maxMessageLength`, `textToImport`, `mainPrompt`, `messagePrepend`, `messageAppend`, `useFinalPrompt`, `finalPrompt` |
| `file-get`  | Content Script| Popup Script  | `command`, `content` (Contains the content of the file or an empty string.)                                              |
| `file-get`  | Popup Script  | Content Script| `command`                                                                                                                |
| `stop`      | Popup Script  | Content Script| `command`                                                                                                                |
| `file-pick` | Popup Script  | Content Script| `command`                                                                                                                |

In this table:
- The **Command** column represents the type of command/message being sent.
- The **Sender** column specifies which script is sending the command.
- The **Receiver** column specifies which script is receiving the command.
- The **Fields** column lists all the fields present in the message for the corresponding command.
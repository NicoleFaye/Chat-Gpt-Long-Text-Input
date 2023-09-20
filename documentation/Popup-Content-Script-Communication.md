| Command     | Sender        | Receiver      | Fields Always Sent | Fields Sometimes Sent                                                                                                   |
|-------------|---------------|---------------|-------------------|-------------------------------------------------------------------------------------------------------------------------|
| `run`       | Popup Script  | Content Script| `command`         | `maxMessageLength`, `textToImport`, `mainPrompt`, `messagePrepend`, `messageAppend`, `useFinalPrompt`, `finalPrompt`    |
| `file-get`  | Content Script| Popup Script  | `command`         | `content` (Contains the content of the file or an empty string.)                                                         |
| `file-get`  | Popup Script  | Content Script| `command`         | None                                                                                                                    |
| `stop`      | Popup Script  | Content Script| `command`         | None                                                                                                                    |
| `file-pick` | Popup Script  | Content Script| `command`         | None                                                                                                                    |

In this table:
- The **Command** column represents the type of command/message being sent.
- The **Sender** column specifies which script is sending the command.
- The **Receiver** column specifies which script is receiving the command.
- The **Fields Always Sent** column lists the fields that are always present in the message.
- The **Fields Sometimes Sent** column lists the fields that may or may not be present in the message, depending on the context or conditions.
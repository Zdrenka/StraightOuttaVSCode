import * as vscode from "vscode";
import { Channel } from "./model/Channel";
import { User } from "./model/User";

const { WebClient } = require("@slack/web-api");
const channelList: { id: any; label: string; description: string }[] = [];
export function activate(context: vscode.ExtensionContext) {
  const web = new WebClient(
    "TOKEN"
  );
  vscode.commands.registerCommand("codetoslack.copy", () => copy(web));
}

export async function copy(web: any) {
  channelList.length = 0;
  /*
	Get the selected text from the editor, 
	also the languiage of the editor
	and the file name
  */
  const editor = vscode.window.activeTextEditor!;
  const selection = editor.selection;
  const code = editor.document.getText(selection)!;
  const lang = editor.document.languageId;
  const fileName = editor.document.fileName.replace(/^.*[\\\/]/, "");

  // enter Slack web api
  const users = await web.users.list();
  const channels = await web.conversations.list({
    types: "public_channel, private_channel",
  });

  buildMenu(users.members, channels.channels);
  //show quickPick menu and send on click
  quickPickAndSend(web, fileName, code, lang);
}

function buildMenu(members: User[], channels: Channel[]) {
  if (members) {
    members.forEach((m: any) => {
      if (!m.is_bot) {
        channelList.push({
          id: m.id,
          label: `@${m.name}`,
          description: m.profile.real_name,
        });
      }
    });
  }
  if (channels) {
    channels.forEach((c: any) => {
      channelList.push({
        id: c.id,
        label: `#${c.name}`,
        description: c.topic.value,
      });
    });
  }
}

function quickPickAndSend(
  web: any,
  fileName: string,
  code: string,
  lang: string
) {
  const channels = channelList.filter((c) => c.label.startsWith("#"));
  const members = channelList.filter((c) => c.label.startsWith("@"));
  channels.sort((a, b) => (a.label > b.label ? 1 : -1));
  members.sort((a, b) => (a.label > b.label ? 1 : -1));
  return vscode.window
    .showQuickPick([...channels, ...members], {
      matchOnDescription: true,
      placeHolder: "Select a user / channel",
    })
    .then(async (selection) => {
      await web.files
        .upload({
          channels: selection!.id,
          title: fileName,
          content: code,
          as_user: true,
          filetype: lang,
        })
        .then(() => {
          vscode.window.showInformationMessage(
            lang + " code sent to " + selection?.label
          );
        });
    });
}
// this method is called when your extension is deactivated
export function deactivate() {}

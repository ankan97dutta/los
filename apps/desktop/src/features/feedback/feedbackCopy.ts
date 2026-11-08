export const FEEDBACK_COPY = {
  privacy:
    'Continuing opens GitHub in your browser with this draft. Issues are public on the LOS repository (or as that repo’s visibility allows). Nothing is uploaded from LOS in the background.',
  browserOpened: 'Opened GitHub in your browser. Finish creating the issue there — LOS has not filed it for you.',
  browserOpenedPaste:
    'Opened GitHub in your browser. Your description is on the clipboard — paste it into the issue body. LOS has not filed the issue for you.',
  clipboardFailed:
    'Opened GitHub in your browser. We could not copy the description automatically — paste it from the dialog if you still have it open, or reopen Feedback. LOS has not filed the issue for you.',
  openFailed: 'Could not open GitHub. Check your network or try again. Your draft is still here.',
  kindRequired: 'Choose Bug, Idea, or Other.',
  titleRequired: 'Add a short title.',
  descriptionRequired: 'Add a description.',
  copyDraftDone: 'Draft copied to the clipboard.',
  copyDraftFailed: 'Could not copy the draft. Select the text and copy manually.',
} as const;

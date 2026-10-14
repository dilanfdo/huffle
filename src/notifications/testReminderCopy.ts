/** Development-only copy for the test reminder; no React Native imports so it is unit-testable. */
export function testReminderCopy(args: { name: string; reminderTime: string }): { title: string; body: string } {
  return {
    title: `${args.name} is around`,
    body: `This is a test reminder. Your daily nudge arrives at ${args.reminderTime}.`,
  };
}

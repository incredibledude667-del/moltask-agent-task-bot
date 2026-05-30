export function getTaskId(task) {
  return firstString(task, ['id', 'task_id', 'taskId', 'uuid', '_id', 'slug']);
}

export function getTaskTitle(task) {
  return firstString(task, ['title', 'name', 'headline', 'summary']) || 'Untitled task';
}

export function getTaskDescription(task) {
  return firstString(task, [
    'description',
    'details',
    'body',
    'content',
    'instructions',
    'summary'
  ]) || '';
}

export function getTaskStatus(task) {
  return firstString(task, ['status', 'state']) || '';
}

export function getTaskCategory(task) {
  return firstString(task, ['category', 'type', 'task_type', 'tag', 'kind']) || '';
}

export function getTaskReward(task) {
  const keys = [
    'reward',
    'reward_amount',
    'rewardAmount',
    'bounty',
    'bounty_amount',
    'bountyAmount',
    'amount',
    'molt',
    'molt_amount',
    'price',
    'payout'
  ];
  for (const key of keys) {
    if (task && task[key] !== undefined && task[key] !== null && task[key] !== '') {
      return task[key];
    }
  }
  return '';
}

export function taskText(task) {
  return [
    getTaskTitle(task),
    getTaskDescription(task),
    getTaskCategory(task),
    Array.isArray(task?.tags) ? task.tags.join(' ') : ''
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

export function taskSummary(task) {
  return {
    id: getTaskId(task) || '',
    title: getTaskTitle(task),
    description: getTaskDescription(task),
    status: getTaskStatus(task),
    category: getTaskCategory(task),
    reward: getTaskReward(task)
  };
}

function firstString(object, keys) {
  for (const key of keys) {
    const value = object?.[key];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
    if (typeof value === 'number' && Number.isFinite(value)) {
      return String(value);
    }
  }
  return '';
}

/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';

import nls = require('vs/nls');
import { TPromise } from 'vs/base/common/winjs.base';

import QuickOpen = require('vs/base/parts/quickopen/common/quickOpen');
import Model = require('vs/base/parts/quickopen/browser/quickOpenModel');
import { IQuickOpenService } from 'vs/platform/quickOpen/common/quickOpen';
import { ProblemMatcherRegistry } from 'vs/platform/markers/common/problemMatcher';

import { Task, TaskGroup } from 'vs/workbench/parts/tasks/common/tasks';
import { ITaskService } from 'vs/workbench/parts/tasks/common/taskService';

import * as base from './quickOpen';

class TaskEntry extends base.TaskEntry {
	constructor(taskService: ITaskService, quickOpenService: IQuickOpenService, task: Task, highlights: Model.IHighlight[] = []) {
		super(taskService, quickOpenService, task, highlights);
	}

	public run(mode: QuickOpen.Mode, context: Model.IContext): boolean {
		if (mode === QuickOpen.Mode.PREVIEW) {
			return false;
		}
		let task = this._task;
		if (this.taskService.canCustomize() && task.problemMatchers === void 0 || task.problemMatchers.length === 0) {
			this.attachProblemMatcher(task).then((task) => {
				this.doRun(task);
			});
			return true;
		} else {
			return this.doRun(task);
		}
	}
}

export class QuickOpenHandler extends base.QuickOpenHandler {
	constructor(
		@IQuickOpenService quickOpenService: IQuickOpenService,
		@ITaskService taskService: ITaskService
	) {
		super(quickOpenService, taskService);
	}

	public getAriaLabel(): string {
		return nls.localize('tasksAriaLabel', "Type the name of a build task");
	}

	protected getTasks(): TPromise<Task[]> {
		return ProblemMatcherRegistry.onReady().then(() => this.taskService.getTasksForGroup(TaskGroup.Build));
	}

	protected createEntry(task: Task, highlights: Model.IHighlight[]): base.TaskEntry {
		return new TaskEntry(this.taskService, this.quickOpenService, task, highlights);
	}

	public getEmptyLabel(searchString: string): string {
		if (searchString.length > 0) {
			return nls.localize('noTasksMatching', "No tasks matching");
		}
		return nls.localize('noTasksFound', "No build tasks found");
	}
}

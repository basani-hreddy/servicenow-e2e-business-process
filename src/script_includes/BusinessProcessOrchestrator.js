// Table: sys_script_include
// Name: BusinessProcessOrchestrator
// API Name: x_custom.BusinessProcessOrchestrator
// Active: true
// Description: Orchestrates end-to-end business process flows across ServiceNow modules.

var BusinessProcessOrchestrator = Class.create();
BusinessProcessOrchestrator.prototype = {
    initialize: function(processName) {
        this.processName = processName;
        this.steps       = [];
        this.errors      = [];
    },

    /**
     * Register a process step.
     * @param {string} stepName
     * @param {Function} fn - function(context) that returns true on success
     */
    addStep: function(stepName, fn) {
        this.steps.push({ name: stepName, fn: fn });
    },

    /**
     * Execute all steps in sequence, stop on first failure.
     * @param {Object} context - shared data passed to each step
     * @returns {Object} {success, completed, failed, errors}
     */
    run: function(context) {
        var completed = [];
        var failed    = null;
        context       = context || {};

        for (var i = 0; i < this.steps.length; i++) {
            var step = this.steps[i];
            try {
                var ok = step.fn(context);
                if (ok === false) {
                    failed = step.name;
                    this.errors.push(step.name + ': returned false');
                    break;
                }
                completed.push(step.name);
            } catch (e) {
                failed = step.name;
                this.errors.push(step.name + ': ' + e.message);
                break;
            }
        }

        var success = !failed;
        gs.log('BusinessProcessOrchestrator [' + this.processName + ']: ' +
               (success ? 'SUCCESS' : 'FAILED at ' + failed) +
               ' — ' + completed.length + '/' + this.steps.length + ' steps completed');

        return {
            success:   success,
            completed: completed,
            failed:    failed,
            errors:    this.errors
        };
    },

    type: 'BusinessProcessOrchestrator'
};

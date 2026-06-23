// Table: sc_request  (Business Rule)
// Name: Order Fulfillment Orchestrator Trigger
// Trigger table: sc_request
// When: after
// Actions: insert=false update=true delete=false query=false
// Description: Trigger end-to-end fulfillment orchestration when request is approved.

(function executeRule(current, previous) {
    if (current.approval.toString() !== 'approved') return;
    if (previous.approval.toString() === 'approved') return; // already processed

    var orch = new BusinessProcessOrchestrator('OrderFulfillment');

    orch.addStep('Validate request items', function(ctx) {
        var items = new GlideRecord('sc_req_item');
        items.addQuery('request', current.getUniqueValue());
        items.query();
        ctx.itemCount = 0;
        while (items.next()) ctx.itemCount++;
        return ctx.itemCount > 0;
    });

    orch.addStep('Create fulfillment tasks', function(ctx) {
        var items = new GlideRecord('sc_req_item');
        items.addQuery('request', current.getUniqueValue());
        items.query();
        ctx.tasks = [];
        while (items.next()) {
            var task = new GlideRecord('sc_task');
            task.initialize();
            task.request_item  = items.getUniqueValue();
            task.short_description = 'Fulfill: ' + items.cat_item.getDisplayValue();
            task.state         = '1';
            ctx.tasks.push(task.insert());
        }
        return ctx.tasks.length > 0;
    });

    orch.addStep('Notify requester', function(ctx) {
        gs.eventQueue('request.approved', current,
            current.requested_for.toString(), current.number.toString());
        return true;
    });

    var result = orch.run({});
    if (!result.success) {
        gs.warn('OrderFulfillment failed: ' + JSON.stringify(result.errors));
    }
})(current, previous);

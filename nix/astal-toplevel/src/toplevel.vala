namespace AstalToplevel {
public class Toplevel : Object {
    private unowned ToplevelManager manager;
    private unowned ZwlrForeignToplevelHandleV1 handle;

    /**
     * The toplevel's title.
     */
    public string title { get; private set; default = ""; }
    /**
     * The toplevel's app id.
     */
    public string app_id { get; private set; default = ""; }
    /**
     * Whether the toplevel is currently activated (focused).
     */
    public bool activated { get; private set; default = false; }

    private const ZwlrForeignToplevelHandleV1Listener listener = {
        handle_title,
        handle_app_id,
        handle_output_enter,
        handle_output_leave,
        handle_state,
        handle_done,
        handle_closed,
        handle_parent,
    };

    internal Toplevel(ToplevelManager manager, ZwlrForeignToplevelHandleV1 handle) {
        this.manager = manager;
        this.handle = handle;
        handle.set_user_data(this);
        handle.add_listener(listener, this);
    }

    public override void dispose() {
        debug("toplevel %p dispose", this);
        handle.destroy();
        base.dispose();
    }

    private void handle_title(ZwlrForeignToplevelHandleV1 handle, string title) {
        this.title = title;
    }

    private void handle_app_id(ZwlrForeignToplevelHandleV1 handle, string app_id) {
        this.app_id = app_id;
    }

    private void handle_output_enter(ZwlrForeignToplevelHandleV1 handle, Wl.Output output) {
    }

    private void handle_output_leave(ZwlrForeignToplevelHandleV1 handle, Wl.Output output) {
    }

    private void handle_state(ZwlrForeignToplevelHandleV1 handle, Wl.Array state) {
        uint32* data = state.data;
        var count = state.size / sizeof(uint32);
        var act = false;
        for (var i = 0; i < count; i++) {
            if (data[i] == 2) { // activated
                act = true;
                break;
            }
        }
        this.activated = act;
    }

    private void handle_done(ZwlrForeignToplevelHandleV1 handle) {
    }

    private void handle_closed(ZwlrForeignToplevelHandleV1 handle) {
        manager.handle_toplevel_closed(this);
    }

    private void handle_parent(ZwlrForeignToplevelHandleV1 handle, ZwlrForeignToplevelHandleV1 parent) {
    }
}
}

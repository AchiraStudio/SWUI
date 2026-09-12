export interface SwuiRuntimeConfig {
    /** Target frame rate for the CEF browser (e.g. 30, 60, 120). */
    frameRate?: number;
    /** Scheduler priority. */
    priority?: 'critical' | 'high' | 'normal' | 'low' | 'background';
    /** If true, the document survives level changes. */
    persistent?: boolean;
    /** Functional document layer. */
    layer?: 'persistent' | 'level' | 'modal';
    /** Load behavior (lazy on activation vs eager preloaded). */
    loadBehavior?: 'lazy' | 'eager';
}
export interface SwuiConfig {
    /** Name / Document ID of the UI application. */
    name: string;
    /** Frontend framework used. */
    framework?: 'react' | 'vue' | 'svelte' | 'vanilla' | 'next';
    /** Entry script or html file. */
    entry?: string;
    /** Output directory for production build artifacts. */
    output?: string;
    /** Runtime scheduler and document lifecycle settings. */
    runtime?: SwuiRuntimeConfig;
}
/**
 * Type-safe configuration helper for swui.config.ts files.
 */
export declare function defineSwuiConfig(config: SwuiConfig): SwuiConfig;

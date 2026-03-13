declare module 'd3-org-chart' {
  export class OrgChart {
    constructor();
    container(el: string | HTMLElement): this;
    data(data: any[]): this;
    nodeHeight(d: (node: any) => number): this;
    nodeWidth(d: (node: any) => number): this;
    childrenMargin(d: (node: any) => number): this;
    compact(compact: boolean): this;
    nodeContent(content: (node: any) => string): this;
    render(): this;
    onNodeClick(callback: (nodeId: string) => void): this;
    // คุณสามารถเพิ่ม method อื่นๆ ที่ต้องการใช้งานได้ที่นี่
    [key: string]: any; 
  }
}
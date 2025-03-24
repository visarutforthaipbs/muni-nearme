declare module "topojson-client" {
  import { Feature, FeatureCollection, GeoJsonProperties } from "geojson";

  export type GeometryObject = any;
  export type Topology = any;
  export type Objects<P> = any;

  export function feature<P extends GeoJsonProperties>(
    topology: any,
    object: any
  ): FeatureCollection<any, P>;

  export function mesh(topology: any, object: any, filter?: Function): any;
  export function meshArcs(topology: any, object: any, filter?: Function): any;
  export function merge(topology: any, objects: any[]): any;
  export function mergeArcs(topology: any, objects: any[]): any;
  export function neighbors(objects: any[]): any[][];
}

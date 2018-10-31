// Type definitions for @rematch/select 2.0.0
// Definitions by: Sam Richard <https://github.com/d3dc>
//                 Michał Lytek <https://github.com/19majkel94>

import * as Rematch from "@rematch/core";
import * as Reselect from "reselect";

export { createSelector, createStructuredSelector } from "reselect";

export interface SelectConfig {
  sliceState?: any;
  selectorCreator?: any;
}

declare const createSelectPlugin: (
  config?: SelectConfig
) => Rematch.Plugin<Rematch.Models, Rematch.Action<any, any>>;
export default createSelectPlugin;

export type Selector<TState, TReturns, TProps = void> = TProps extends void
  ? (state: TState) => TReturns
  : (state: TState, props: TProps) => TReturns;

/****************************************
 *  types for selectors config in model *
 ****************************************/

declare module "@rematch/core" {
  export interface ModelConfig<S = any, SS = S> {
    selectors?: ModelSelectorsConfig<S>;
  }
}

export type ModelSelectorsConfig<TSliceState, TRootState = any> =
  | ModelSelectorsFactory<TSliceState, TRootState>
  | ModelSelectorFactories<TSliceState, TRootState>;

export type ModelSelectorsFactory<TSliceState, TRootState> = (
  slice: Slicer<TSliceState, TRootState>,
  createSelector: SelectorCreator,
  hasProps: Parameterizer<TSliceState, TRootState>
) => ModelSelectorFactories<TSliceState, TRootState>;

export type SelectorCreator = typeof Reselect.createSelector;

export interface ModelSelectorFactories<TSliceState, TRootState> {
  [key: string]:
    | SelectorFactory<TSliceState, TRootState>
    | SelectorParametricFactory<TSliceState, TRootState>;
}

export type SelectorFactory<TSliceState, TRootState> = <TReturns>(
  // FIXME: https://github.com/Microsoft/TypeScript/issues/27862
  this: ModelSelectorFactories<TSliceState, TRootState>,
  models: ModelsSelectors<TRootState>
) => Selector<TRootState, TReturns>;

export type SelectorParametricFactory<
  TSliceState,
  TRootState,
  TProps = any,
  TReturns = any
> = (
  // FIXME: https://github.com/Microsoft/TypeScript/issues/27862
  this: ModelSelectorFactories<TSliceState, TRootState>,
  models: ModelsSelectors<TRootState>,
  props: TProps
) => Selector<TRootState, TReturns, TProps>;

export type Parameterizer<TSliceState, TRootState> = <TProps, TReturns>(
  factory: SelectorParametricFactory<TSliceState, TRootState, TProps, TReturns>
) => ParameterizerSelectorFactory<TSliceState, TRootState, TProps, TReturns>;

// the same as `SelectorParametricFactory` but with different return signature
export type ParameterizerSelectorFactory<
  TSliceState,
  TRootState,
  TProps = any,
  TReturns = any
> = (
  // FIXME: https://github.com/Microsoft/TypeScript/issues/27862
  this: ModelSelectorFactories<TSliceState, TRootState>,
  models: ModelsSelectors<TRootState>,
  props: TProps
) => (props: TProps) => Selector<TRootState, TReturns>;

export type Slicer<TSliceState, TRootState> = (<TReturns>(
  resultFn: (slice: TSliceState) => TReturns
) => Selector<TRootState, TReturns>) &
  Selector<TRootState, TSliceState>;

export type ModelsSelectors<TRootState = any> = {
  [key: string]: ModelSelectorFactories<any, TRootState>;
};

/*******************************************
 *  types for select inference from models *
 *******************************************/

declare module "@rematch/core" {
  export interface RematchStore<
    M extends Models = Models,
    A extends Action = Action
  > {
    select: RematchSelect<M, Rematch.RematchRootState<Models>>;
  }
}

export type RematchSelect<TModels extends Rematch.Models, TRootState = any> = (<
  TProps,
  TSelectProps
>(
  mapSelectToProps: (models: RematchSelect<TModels, TRootState>) => TSelectProps
) => Reselect.OutputParametricSelector<
  TRootState,
  TProps,
  ReturnTypeOfSelectProps<TSelectProps>,
  Selector<TRootState, ReturnTypeOfSelectProps<TSelectProps>>
>) &
  StoreSelectors<TModels, TRootState>;

export type StoreSelectors<TModels extends Rematch.Models, TRootState> = {
  [TModelKey in keyof TModels]: ModelSelectors<TModels[TModelKey], TRootState>
};

export type ModelSelectors<TModel extends Rematch.ModelConfig, TRootState> = {
  [key in keyof ExtractSelectorsFromModel<
    TModel
  >]: ExtractSelectorsSignatureFromSelectorsModel<
    TRootState,
    ExtractSelectorsFromModel<TModel>,
    key
  >
};

export type ReturnTypeOfSelectProps<TSelectProps> = {
  [key in keyof TSelectProps]: TSelectProps[key] extends (
    ...args: any[]
  ) => infer TReturn
    ? TReturn
    : never
};

export type ExtractSelectorsFromModel<
  TModel extends Rematch.ModelConfig
> = 
	// thunk case: (models) => ({...})
	TModel["selectors"] extends (...args: any[]) => infer TReturnObj
	  ? TReturnObj
	  : // normal object case
      TModel["selectors"] extends object
        ? TModel["selectors"]
        : never;

export type ExtractSelectorsSignatureFromSelectorsModel<
  TRootState,
  TSelectorsConfigObject,
  TKey extends keyof TSelectorsConfigObject
> = TSelectorsConfigObject[TKey] extends (...args: any[]) => infer TSelector
  ? // hasProps case
    TSelector extends (
      props: infer TProps
    ) => Selector<any, infer TReturns>
    ? (props: TProps) => Selector<TRootState, TReturns>
    : // selector without props case
      TSelector extends Selector<any, infer TReturns>
      ? Selector<TRootState, TReturns>
      : // selector with props case
        (TSelector extends Selector<
          any,
          infer TReturns,
          infer TProps
        >
          ? Selector<TRootState, TReturns, TProps>
          : never)
  : never;

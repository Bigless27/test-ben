type StockSymbol = string;

type Operators = 'gt' | 'lt' | 'gte' | 'lte' | 'eq' | 'ieq';
type Scaler = number | string;
type ArrayValue =
  | StockSymbol[]
  | string[]
  | number[]
  | { watchlist_id: string }
  | { screener_id: string }
  | { screener_query: string };

type ArrayToken<FieldType> = [FieldType, 'all' | 'any' | 'in', ArrayValue];
type SearchToken<FieldType> = [FieldType, 'match' | 'phrase' | 'search' | 'term', string];
type RangeToken<FieldType> = [FieldType, 'range', [number, number]];
type SingletonToken<FieldType> = [FieldType, Operators, Scaler];

export type Token<FieldType> =
  | ArrayToken<FieldType>
  | RangeToken<FieldType>
  | SearchToken<FieldType>
  | SingletonToken<FieldType>;

interface LogicalToken<FieldType> {
  lhs: ExpressionType<FieldType>;
  operator: 'or' | 'and';
  rhs: ExpressionType<FieldType>;
}

interface GroupToken<FieldType> {
  group: ExpressionType<FieldType>;
  operator: 'not' | 'group';
}

interface ExpressionToken<FieldType> {
  expression: Token<FieldType>;
  operator: 'expression';
}

export type ExpressionType<FieldType> = ExpressionToken<FieldType> | LogicalToken<FieldType> | GroupToken<FieldType>;
export class Expression<FieldType> {
  protected expression: ExpressionType<FieldType>;
  protected grouped = false;
  protected inverse = false;

  protected constructor(arg: { type: 'token'; val: Token<FieldType> });
  protected constructor(arg: { type: 'expression'; val: Expression<FieldType> });
  protected constructor(arg: { type: 'expressionType'; val: ExpressionType<FieldType> });
  protected constructor(arg: {
    type: 'token' | 'expression' | 'expressionType';
    val: Token<FieldType> | Expression<FieldType> | ExpressionType<FieldType>;
  }) {
    switch (arg.type) {
      case 'token':
        this.expression = { expression: arg.val as Token<FieldType>, operator: 'expression' };
        break;
      case 'expressionType':
        this.expression = arg.val as ExpressionType<FieldType>;
        break;
      case 'expression':
        this.expression = (arg.val as Expression<FieldType>).getExpressionType();
        break;
    }
  }

  public static fromToken = <FieldType>(val: Token<FieldType>): Expression<FieldType> => {
    return new Expression({ type: 'token', val });
  };

  public static fromExpression = <FieldType>(val: Expression<FieldType>): Expression<FieldType> => {
    return new Expression({ type: 'expression', val });
  };

  public static fromExpressionType = <FieldType>(val: ExpressionType<FieldType>): Expression<FieldType> => {
    return new Expression({ type: 'expressionType', val });
  };

  private static clone = <T>(source: T): T => {
    return Array.isArray(source)
      ? (source as unknown[]).map(item => Expression.clone(item))
      : source instanceof Date
      ? new Date(source.getTime())
      : source && typeof source === 'object'
      ? Object.getOwnPropertyNames(source).reduce((o, prop) => {
          Object.defineProperty(
            o,
            prop,
            Object.getOwnPropertyDescriptor(source, prop) as Record<string | number | symbol, unknown>,
          );
          o[prop] = Expression.clone((source as Record<string | number | symbol, unknown>)[prop]);
          return o;
        }, Object.create(Object.getPrototypeOf(source)))
      : (source as T);
  };

  public and = (expression: Expression<FieldType>): Expression<FieldType> => {
    this.operator(expression, 'and');
    return this;
  };

  public or = (expression: Expression<FieldType>): Expression<FieldType> => {
    this.operator(expression, 'or');
    return this;
  };

  public parentheses = (val: boolean): Expression<FieldType> => {
    this.grouped = val;
    return this;
  };

  public not = (val: boolean): Expression<FieldType> => {
    this.inverse = val;
    return this;
  };

  // try to not call this. only use this for saving to layout.
  public getExpressionType = (): ExpressionType<FieldType> => {
    if (this.grouped || this.inverse) {
      return { group: this.expression, operator: this.inverse ? 'not' : 'group' };
    } else {
      return this.expression;
    }
  };

  protected operator = (expression: Expression<FieldType>, operator: 'or' | 'and'): void => {
    const thereExpression = expression.getExpressionType();
    if (thereExpression && this.expression) {
      this.expression = { lhs: this.expression, operator: operator, rhs: Expression.clone(thereExpression) };
    } else if (thereExpression) {
      this.expression = Expression.clone(thereExpression);
    }
  };
}

import { RequireOnlyOne } from '@benzinga/utils';
import { Expression, ExpressionType, Token } from './expression';

type BZQLRecursion<FieldType> = RequireOnlyOne<{
  $: Token<FieldType>;
  _: BZQLRecursion<FieldType>[];
  and: BZQLRecursion<FieldType>;
  not: BZQLRecursion<FieldType>;
  or: BZQLRecursion<FieldType>;
}>;

export type BZQLExpressionType<FieldType> = [BZQLRecursion<FieldType>];

export class BZQLExpression<FieldType> extends Expression<FieldType> {
  public static fromToken = <FieldType>(val: Token<FieldType>): BZQLExpression<FieldType> => {
    return new BZQLExpression({ type: 'token', val });
  };

  public static fromExpression = <FieldType>(val: Expression<FieldType>): BZQLExpression<FieldType> => {
    return new BZQLExpression({ type: 'expression', val });
  };

  public static fromExpressionType = <FieldType>(val: ExpressionType<FieldType>): BZQLExpression<FieldType> => {
    return new BZQLExpression({ type: 'expressionType', val });
  };

  public static fromBZQL = <FieldType>(bzqlWhere: BZQLExpressionType<FieldType>): Expression<FieldType> | undefined => {
    // recursion function
    const fromBZQLRecursion = <FieldType>(
      bzqlWhere: BZQLRecursion<FieldType>,
      previousToken?: Expression<FieldType>,
    ): Expression<FieldType> | undefined => {
      const keys = Object.keys(bzqlWhere);
      if (keys.length !== 1) {
        return undefined;
      }

      const type = keys[0] as 'and' | 'or' | 'not' | '_' | '$';

      switch (type) {
        case 'and': {
          const rhs = fromBZQLRecursion(bzqlWhere[type] as BZQLRecursion<FieldType>);
          if (rhs && previousToken) {
            return previousToken.and(rhs);
          } else {
            return undefined;
          }
        }
        case 'or': {
          const rhs = fromBZQLRecursion(bzqlWhere[type] as BZQLRecursion<FieldType>);
          if (rhs && previousToken) {
            return previousToken.or(rhs);
          } else {
            return undefined;
          }
        }
        case 'not': {
          const group = fromBZQLRecursion(bzqlWhere[type] as BZQLRecursion<FieldType>);
          if (group) {
            return group.not(true);
          } else {
            return undefined;
          }
        }
        case '_': {
          const group = bzqlWhere[type];
          if (Array.isArray(group)) {
            const groupResult = group.reduce<Expression<FieldType> | undefined>((acc, item) => {
              if (acc === undefined) {
                return fromBZQLRecursion(item);
              } else {
                return fromBZQLRecursion(item, acc);
              }
            }, undefined);
            if (groupResult) {
              return groupResult.parentheses(true);
            } else {
              return undefined;
            }
          } else {
            return undefined;
          }
        }
        case '$': {
          const group = bzqlWhere[type];
          if (group) {
            return Expression.fromToken(group);
          } else {
            return undefined;
          }
        }
      }
    };
    return fromBZQLRecursion({ _: bzqlWhere });
  };

  public static fromBZQLToExpressionType = <FieldType>(
    bzqlWhere: BZQLExpressionType<FieldType>,
  ): ExpressionType<FieldType> | undefined => {
    return BZQLExpression.fromBZQL(bzqlWhere)?.getExpressionType();
  };

  public static generateBZQL = <FieldType>(token: ExpressionType<FieldType>): BZQLExpressionType<FieldType> => {
    // recursion function
    const generateBZQLRecursion = <FieldType>(token: ExpressionType<FieldType>): BZQLRecursion<FieldType> => {
      switch (token.operator) {
        case 'and':
          return {
            _: [{ ...generateBZQLRecursion(token.lhs) }, { and: generateBZQLRecursion(token.rhs) }],
          };
        case 'or':
          return { _: [{ ...generateBZQLRecursion(token.lhs) }, { or: generateBZQLRecursion(token.rhs) }] };
        case 'not':
          return { not: generateBZQLRecursion(token.group) };
        case 'group':
          return { _: [generateBZQLRecursion(token.group)] };
        case 'expression':
          return { $: token.expression };
      }
    };
    return [generateBZQLRecursion(token)];
  };

  public and = (expression: Expression<FieldType>): BZQLExpression<FieldType> => {
    this.operator(expression, 'and');
    return this;
  };

  public or = (expression: Expression<FieldType>): BZQLExpression<FieldType> => {
    this.operator(expression, 'or');
    return this;
  };

  public parentheses = (val: boolean): BZQLExpression<FieldType> => {
    this.grouped = val;
    return this;
  };

  public not = (val: boolean): BZQLExpression<FieldType> => {
    this.inverse = val;
    return this;
  };

  public toBZQL = (): BZQLExpressionType<FieldType> => {
    return BZQLExpression.generateBZQL(this.getExpressionType());
  };
}

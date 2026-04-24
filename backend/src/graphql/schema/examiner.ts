export const examinerSchema = `#graphql
  type Examiner {
    id: ID!
    examinerCode: String!
    name: String!
    specialty: String!
    email: String!
    role: String!
    status: String!
    studies: [Study!]!
    sites: [Site!]!
  }

  type ExaminerPage {
    rows: [Examiner!]!
    total: Int!
  }

  input CreateExaminerInput {
    examinerCode: String!
    name: String!
    specialty: String!
    email: String!
    role: String!
    status: String
  }

  input UpdateExaminerInput {
    name: String
    specialty: String
    email: String
    role: String
    status: String
  }

  extend type Query {
    getExaminer(id: ID!): Examiner
    getExaminers(page: Int, pageSize: Int): ExaminerPage!
  }

  extend type Mutation {
    createExaminer(input: CreateExaminerInput!): Examiner!
    updateExaminer(id: ID!, input: UpdateExaminerInput!): Examiner!
  }
`;

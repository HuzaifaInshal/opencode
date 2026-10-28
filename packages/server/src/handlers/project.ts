import { Project } from "@opencode/core/project"
import { Effect } from "effect"
import { HttpApiBuilder } from "effect/http-api"
import { Api } from "../api"
import { ConflictError, InvalidRequestError, ProjectNotFoundError } from "@opencode/protocol/errors"

export const ProjectHandler = HttpApiBuilder.group(Api, "server.project", (handlers) =>
  Effect.gen(function* () {
    const project = yield* Project.Service
    return handlers
      .handle("project.list", (ctx) => project.list(ctx.query))
      .handle("project.update", (ctx) =>
        project.update({ ...ctx.payload, projectID: ctx.params.projectID }).pipe(
          Effect.mapError(
            () =>
              new ProjectNotFoundError({
                projectID: ctx.params.projectID,
                message: `Project not found: ${ctx.params.projectID}`,
              }),
          ),
        ),
      )
      .handle("project.clone", (ctx) =>
        project.clone(ctx.payload).pipe(
          Effect.mapError((error) => {
            if (error.message.includes("already exists and is not empty")) {
              return new ConflictError({
                message: error.message,
                resource: error.directory,
              })
            }
            return new InvalidRequestError({
              message: error.message,
              field: "url",
            })
          }),
        ),
      )
  }),
)

#!/usr/bin/env node
/// <reference types="bun-types" />
/// <reference types="node" />
/// <reference lib="dom" />
declare module "gamerbot/lib/commands/context" {
    import type { PrismaClient } from '@prisma/client';
    import { BaseInteraction, ChatInputCommandInteraction, ContextMenuCommandInteraction, Message, MessageContextMenuCommandInteraction, User, UserContextMenuCommandInteraction } from 'discord.js';
    import type { GamerbotClient } from "gamerbot/lib/client/GamerbotClient";
    export class BaseContext<T extends BaseInteraction = BaseInteraction> {
        readonly interaction: T;
        readonly prisma: PrismaClient;
        readonly client: GamerbotClient;
        constructor(client: GamerbotClient, interaction: T, prisma: PrismaClient);
        get user(): T['user'];
        get member(): T['member'];
        get channel(): T['channel'];
        get guild(): T['guild'];
        get createdTimestamp(): T['createdTimestamp'];
    }
    export class CommandContext extends BaseContext<ChatInputCommandInteraction> {
        readonly interaction: ChatInputCommandInteraction;
        constructor(client: GamerbotClient, interaction: ChatInputCommandInteraction, prisma: PrismaClient);
        get options(): ChatInputCommandInteraction['options'];
    }
    class ContextMenuCommandContext<T extends ContextMenuCommandInteraction> extends BaseContext<T> {
        readonly interaction: T;
        constructor(client: GamerbotClient, interaction: T, prisma: PrismaClient);
        get options(): T['options'];
    }
    export class UserCommandContext extends ContextMenuCommandContext<UserContextMenuCommandInteraction> {
        get targetUser(): User;
    }
    export class MessageCommandContext extends ContextMenuCommandContext<MessageContextMenuCommandInteraction> {
        get targetMessage(): Message;
    }
}
declare module "gamerbot/lib/types" {
    import type { ApplicationCommandOptionChoiceData, ApplicationCommandOptionData, ApplicationCommandType, AutocompleteInteraction, ChatInputCommandInteraction, Guild, GuildChannel, GuildMember, Interaction, MessageContextMenuCommandInteraction, PermissionsString, UserContextMenuCommandInteraction } from 'discord.js';
    import type { GamerbotClient } from "gamerbot/lib/client/GamerbotClient";
    import type { ChatCommand, CommandResult, MessageCommand, UserCommand } from "gamerbot/lib/commands/command";
    import type { BaseContext, CommandContext, MessageCommandContext, UserCommandContext } from "gamerbot/lib/commands/context";
    export interface GuildRequired<Context extends BaseContext, Int extends Interaction> {
        /**
         * Whether this command is allowed to be used outside a guild (e.g. in a DM).
         *
         * @default false
         */
        guildOnly: true;
        run: (context: Context & {
            interaction: Int & {
                guild: Guild;
                channel: GuildChannel;
                member: GuildMember;
            };
        }) => Promise<CommandResult>;
    }
    export interface GuildOptional<C extends BaseContext> {
        /**
         * Whether this command is allowed to be used outside a guild (e.g. in a DM).
         *
         * @default false
         */
        guildOnly?: false;
        run: (context: C) => Promise<CommandResult>;
    }
    type CommandType<Context extends BaseContext, Int extends Interaction, Options = {}> = BaseCommand & Options & (GuildRequired<Context, Int> | GuildOptional<Context>);
    interface BaseCommand {
        /**
         * Name of the command.
         *
         * For slash commands, this name is used as /commandname (lowercase and no spaces required).
         *
         * For context menu commands, this name is used as the context menu entry (uppercase and spaces
         * preferred).
         */
        name: string;
        /**
         * Description of the command.
         */
        description?: string;
        /**
         * Whether this command is allowed to be used outside a guild (e.g. in a DM).
         *
         * @default false
         */
        guildOnly?: boolean;
        /**
         * Whether usages of this command should be available as a log event.
         *
         * @default false
         */
        logUsage?: boolean;
        /**
         * Array of required permissions for the executor of this command. Command will not be executed if
         * the executor does not have all of these permissions.
         */
        userPermissions?: PermissionsString[];
        /**
         * Array of permissions for the bot for this command. Command will not be executed if the bot does
         * not have these permissions.
         */
        botPermissions?: PermissionsString[];
        /**
         * Longer description of the command. Markdown is supported.
         *
         * Defaults to the shorter description if not provided.
         */
        longDescription?: string;
        /**
         * Example usages of the command.
         */
        examples?: CommandExample[];
    }
    export interface CommandExample {
        /**
         * Options given to the command.
         */
        options: {
            [key: string]: string | number | {
                mention: string;
            } | null | boolean;
        };
        /**
         * Description of what these options do. Markdown is supported.
         */
        description?: string;
    }
    export type ChatCommandDef = CommandType<CommandContext, ChatInputCommandInteraction, {
        /**
         * Description of the command.
         */
        description: string;
        /**
         * Options for the command.
         *
         * Autocomplete events will be handled by this command's `autocomplete` method.
         */
        options?: ApplicationCommandOptionData[];
        /**
         * Autocomplete handler for this command; required if any of the command's options are
         * autocompleteable.
         */
        autocomplete?: (interaction: AutocompleteInteraction, client: GamerbotClient) => Promise<ApplicationCommandOptionChoiceData[]>;
    }>;
    export type UserCommandDef = CommandType<UserCommandContext, UserContextMenuCommandInteraction>;
    export type MessageCommandDef = CommandType<MessageCommandContext, MessageContextMenuCommandInteraction>;
    export interface CommandDefinitionType {
        [ApplicationCommandType.ChatInput]: ChatCommandDef;
        [ApplicationCommandType.User]: UserCommandDef;
        [ApplicationCommandType.Message]: MessageCommandDef;
    }
    export interface CommandObjectType {
        [ApplicationCommandType.ChatInput]: ChatCommand;
        [ApplicationCommandType.User]: UserCommand;
        [ApplicationCommandType.Message]: MessageCommand;
    }
    export interface ContextType {
        [ApplicationCommandType.ChatInput]: CommandContext;
        [ApplicationCommandType.User]: UserCommandContext;
        [ApplicationCommandType.Message]: MessageCommandContext;
    }
    export interface DocsJson {
        version: string;
        discordjsVersion: string;
        commands: Array<{
            name: string;
            type: ApplicationCommandType;
            description: string;
            longDescription: string;
            examples: CommandExample[];
            options: ApplicationCommandOptionData[];
            guildOnly: boolean;
            logUsage: boolean;
            userPermissions: PermissionsString[];
            botPermissions: PermissionsString[];
            sourceLocation: string;
        }>;
    }
    export const KnownInteractions: {
        StringSelect: {
            UrbanDefine: string;
        };
        Button: {
            RoleToggle: string;
        };
    };
}
declare module "gamerbot/lib/util" {
    import { TimeZone } from '@vvo/tzdb';
    import { ApplicationCommandOptionChoiceData, CommandInteraction, ContextMenuCommandInteraction } from 'discord.js';
    import type { Command } from "gamerbot/lib/commands/command";
    import type { ChatCommandDef, MessageCommandDef, UserCommandDef } from "gamerbot/lib/types";
    export const isChatCommand: (def: ChatCommandDef | UserCommandDef | MessageCommandDef) => def is ChatCommandDef;
    export const insertUuidDashes: (uuid: string) => string;
    export const hasPermissions: (interaction: CommandInteraction | ContextMenuCommandInteraction, command: Command) => boolean;
    export const matchString: (input: string, possible: string[]) => ApplicationCommandOptionChoiceData[];
    export const findTimeZone: (input: string) => TimeZone | undefined;
    export const escapeMarkdown: (str: string) => string;
    export const applicationCommandTypeName: {
        readonly 1: "CHAT_INPUT";
        readonly 2: "USER";
        readonly 3: "MESSAGE";
    };
}
declare module "gamerbot/lib/commands/command" {
    import { ApplicationCommandType } from 'discord.js';
    import type { ChatCommandDef, CommandDefinitionType, CommandObjectType, MessageCommandDef, UserCommandDef } from "gamerbot/lib/types";
    export type ChatCommand = Required<ChatCommandDef> & {
        type: ApplicationCommandType.ChatInput;
    };
    export type UserCommand = Required<UserCommandDef> & {
        type: ApplicationCommandType.User;
    };
    export type MessageCommand = Required<MessageCommandDef> & {
        type: ApplicationCommandType.Message;
    };
    export type Command = ChatCommand | UserCommand | MessageCommand;
    export enum CommandResult {
        /**
         * Denotes successful execution of the command.
         */
        Success = 0,
        /**
         * Denotes a failure to execute the command due to invalid user input.
         */
        Invalid = 1,
        /**
         * Denotes a failure to fulfill execution of the command. Typicall an error that is not caused by
         * the user, such as a failed request to an external API, logic error, etc.
         */
        Failure = 2,
        /**
         * Denotes a failure to execute the command due to the user not having the required permissions.
         */
        Unauthorized = 3,
        /**
         * Denotes a failure to execute the command because a resource was not found.
         */
        NotFound = 4
    }
    function command<T extends ApplicationCommandType>(type: T, def: CommandDefinitionType[T]): CommandObjectType[T];
    export default command;
}
declare module "gamerbot/lib/version" {
    export function getVersion(versionOnly?: boolean): Promise<string>;
    export function createReleaseName(production?: boolean): Promise<string>;
}
declare module "gamerbot/lib/env" {
    import { GatewayIntentBits } from 'discord.js';
    const env: Readonly<{
        NODE_ENV: string;
        DEBUG: boolean;
        DOCKER: boolean;
        DISCORD_TOKEN: string;
        DATABASE_URL: string;
        SUPPORT_SERVER_INVITE: string;
        WIKIPEDIA_CONTACT: string;
        EVAL_ALLOWED_USERS?: string | undefined;
        MEDIA_SERVER_ID?: string | undefined;
        DEVELOPMENT_GUILD_ID?: string | undefined;
        SENTRY_DSN?: string | undefined;
        HYPIXEL_CACHE_URL?: string | undefined;
        HYPIXEL_CACHE_SECRET?: string | undefined;
        API_KEY?: string | undefined;
    }>;
    export default env;
    export const IS_DEVELOPMENT: boolean;
    export const CLIENT_INTENTS: GatewayIntentBits[];
    export const SENTRY_RELEASE: string;
    export const GAMERBOT_VERSION: string;
}
declare module "gamerbot/lib/util/path" {
    export const resolvePath: (dir: string) => string;
}
declare module "gamerbot/lib/logger" {
    export const initLogger: () => void;
}
declare module "gamerbot/lib/prisma" {
    import { PrismaClient } from '@prisma/client';
    export const prisma: PrismaClient<{
        errorFormat: "pretty" | "colorless";
        log: ({
            emit: "event";
            level: "query";
        } | {
            emit: "event";
            level: "info";
        } | {
            emit: "event";
            level: "warn";
        } | {
            emit: "event";
            level: "error";
        })[];
    }, "info" | "query" | "warn" | "error", import("@prisma/client/runtime/library").DefaultArgs>;
}
declare module "gamerbot/lib/util/discord" {
    import { Interaction, InteractionReplyOptions, MessagePayload, User } from 'discord.js';
    import { DateTime } from 'luxon';
    export const getDateStringFromSnowflake: (id: string) => [timestamp: string, age: string];
    export const getDateFromSnowflake: (id: string) => DateTime;
    export const getProfileImageUrl: (user: User) => string;
    export const interactionReplySafe: (interaction: Interaction, content: string | MessagePayload | InteractionReplyOptions) => Promise<void>;
}
declare module "gamerbot/lib/client/ClientContext" {
    import * as Sentry from '@sentry/node';
    export class ClientContext {
        transaction: Sentry.Transaction | null;
    }
}
declare module "gamerbot/lib/commands/general/uptime" {
    const COMMAND_UPTIME: import("gamerbot/lib/commands/command").ChatCommand;
    export default COMMAND_UPTIME;
    export function uptime(): string;
}
declare module "gamerbot/lib/client/extensions/_extension" {
    import { Message } from 'discord.js';
    import { Logger } from 'log4js';
    import { GamerbotClient } from "gamerbot/lib/client/GamerbotClient";
    export abstract class ClientExtension {
        readonly client: GamerbotClient;
        readonly name: string;
        logger: Logger;
        constructor(client: GamerbotClient, name: string);
        onReady?(): Promise<void>;
        onMessageCreate?(message: Message): Promise<void>;
    }
}
declare module "gamerbot/lib/client/extensions/api" {
    import { Elysia } from 'elysia';
    import { GamerbotClient } from "gamerbot/lib/client/GamerbotClient";
    import { ClientExtension } from "gamerbot/lib/client/extensions/_extension";
    export default class APIExtension extends ClientExtension {
        constructor(client: GamerbotClient);
        elysia: Elysia<"", {
            store: {};
            request: {};
            schema: {};
            error: {};
            meta: {
                schema: {};
                defs: {};
                exposed: {};
            };
        }>;
        onReady(): Promise<void>;
        private prepareStatus;
        private runEval;
    }
}
declare module "gamerbot/lib/client/extensions/counts" {
    import { GamerbotClient } from "gamerbot/lib/client/GamerbotClient";
    import { ClientExtension } from "gamerbot/lib/client/extensions/_extension";
    export default class CountsExtension extends ClientExtension {
        #private;
        constructor(client: GamerbotClient);
        onReady(): Promise<void>;
        update(): Promise<void>;
        countGuilds(): Promise<number>;
        countUsers(): Promise<number>;
    }
}
declare module "gamerbot/lib/client/extensions/customEmoji" {
    import { GuildEmoji } from 'discord.js';
    import { GamerbotClient } from "gamerbot/lib/client/GamerbotClient";
    import { ClientExtension } from "gamerbot/lib/client/extensions/_extension";
    export default class CustomEmojiExtension extends ClientExtension {
        emojis: Map<string, GuildEmoji>;
        constructor(client: GamerbotClient);
        onReady(): Promise<void>;
        populateEmojis(): Promise<void>;
        get(name: string): GuildEmoji | undefined;
        getString(name: string, fallback?: string): string | undefined;
    }
}
declare module "gamerbot/lib/client/extensions/deploy" {
    import type { GamerbotClient } from "gamerbot/lib/client/GamerbotClient";
    import { ClientExtension } from "gamerbot/lib/client/extensions/_extension";
    export default class DeployExtension extends ClientExtension {
        constructor(client: GamerbotClient);
        onReady(): Promise<void>;
        deploy(): Promise<void>;
    }
}
declare module "gamerbot/lib/client/extensions/eggs" {
    import { Message, PartialMessage, User } from 'discord.js';
    import { GamerbotClient } from "gamerbot/lib/client/GamerbotClient";
    import { ClientExtension } from "gamerbot/lib/client/extensions/_extension";
    class EggsCooldown {
        timestamp: number;
        warned: boolean;
        constructor(timestamp: number, warned?: boolean);
        get expired(): boolean;
    }
    export default class EggExtension extends ClientExtension {
        total: bigint;
        cooldowns: Map<string, EggsCooldown>;
        constructor(client: GamerbotClient);
        onReady(): Promise<void>;
        onMessageCreate(message: Message): Promise<void>;
        getTotal(): Promise<bigint>;
        getEggTotalFromDatabase(): Promise<bigint>;
        grantEgg(msg: Message | PartialMessage): Promise<void>;
        refreshPresence(): Promise<void>;
        assertDatabaseEntry(user: User): Promise<void>;
    }
}
declare module "gamerbot/lib/client/extensions/eval" {
    import { Message } from 'discord.js';
    import { GamerbotClient } from "gamerbot/lib/client/GamerbotClient";
    import { ClientExtension } from "gamerbot/lib/client/extensions/_extension";
    export default class EvalExtension extends ClientExtension {
        constructor(client: GamerbotClient);
        onMessage(message: Message): Promise<void>;
        execute(code: string, message?: Message): Promise<string>;
    }
}
declare module "gamerbot/lib/models/MultiplayerGame" {
    import { AutocompleteInteraction, GuildMember, Interaction, TextChannel } from 'discord.js';
    import { CommandContext } from "gamerbot/lib/commands/context";
    export abstract class MultiplayerGame {
        private context;
        channel: TextChannel;
        creator: GuildMember;
        players: GuildMember[];
        constructor(context: CommandContext, channel: TextChannel, creator: GuildMember);
        get guild(): import("discord.js").Guild;
        abstract main(): Promise<void>;
        setup(): Promise<void>;
        teardown(): Promise<void>;
        onError(err: Error): void;
        start(): Promise<void>;
        get maxPlayers(): number;
        join(interaction: Exclude<Interaction, AutocompleteInteraction>): Promise<void>;
        leave(interaction: Exclude<Interaction, AutocompleteInteraction>): Promise<void>;
    }
}
declare module "gamerbot/lib/models/FlagsGame" {
    import { MultiplayerGame } from "gamerbot/lib/models/MultiplayerGame";
    export const cleanName: (name: string) => string;
    export const flags: Flag[];
    export interface Flag {
        displayName: string;
        names: string[];
        imageUrl: string;
    }
    export interface FlagData {
        name: string;
        aliases?: string[];
        prefix: string;
        image: string;
    }
    export interface FlagYaml {
        url: string;
        flags: FlagData[];
    }
    export class FlagsGame extends MultiplayerGame {
        flagsLeft: Flag[];
        scores: Map<string, number>;
        nextFlag(): Flag | undefined;
        static isCorrectGuess(flag: Flag, guess: string): boolean;
        static makeHint(name: string, hintedChars: number): string;
        delay(ms: number): Promise<boolean>;
        scoreboard(): string;
        main(): Promise<void>;
    }
}
declare module "gamerbot/lib/models/MutliplayerGameExtension" {
    import { GuildMember, TextChannel } from 'discord.js';
    import { GamerbotClient } from "gamerbot/lib/client/GamerbotClient";
    import { ClientExtension } from "gamerbot/lib/client/extensions/_extension";
    import { CommandContext } from "gamerbot/lib/commands/context";
    import { MultiplayerGame } from "gamerbot/lib/models/MultiplayerGame";
    type Constructor<T> = new (context: CommandContext, channel: TextChannel, creator: GuildMember, ...args: unknown[]) => T;
    export class MultiplayerGameExtension<T extends MultiplayerGame> extends ClientExtension {
        readonly type: Constructor<T>;
        readonly name: string;
        constructor(client: GamerbotClient, type: Constructor<T>, name: string);
        games: Map<string, T>;
        get(channelId: string): T | undefined;
        create(context: CommandContext, channel: TextChannel, creator: GuildMember): Promise<T>;
        delete(channelId: string): void;
    }
}
declare module "gamerbot/lib/client/extensions/flags" {
    import { FlagsGame } from "gamerbot/lib/models/FlagsGame";
    import { MultiplayerGameExtension } from "gamerbot/lib/models/MutliplayerGameExtension";
    import { GamerbotClient } from "gamerbot/lib/client/GamerbotClient";
    export default class FlagsExtension extends MultiplayerGameExtension<FlagsGame> {
        constructor(client: GamerbotClient);
    }
}
declare module "gamerbot/lib/util/format" {
    import { CommandInteractionOption } from 'discord.js';
    export const formatOptions: (options: readonly CommandInteractionOption[]) => string;
    export const formatBytes: (bytes: number, decimals?: number) => string;
    export const formatUtcOffset: (offset: number) => string;
    export const formatErrorMessage: (err: unknown) => string;
}
declare module "gamerbot/lib/client/extensions/markov" {
    import { Message } from 'discord.js';
    import { GamerbotClient } from "gamerbot/lib/client/GamerbotClient";
    import { ClientExtension } from "gamerbot/lib/client/extensions/_extension";
    interface MarkovGraph {
        timestamp: number;
        words: {
            [startingWord: string]: {
                [nextWord: string]: number;
            };
        };
    }
    export default class MarkovExtension extends ClientExtension {
        #private;
        constructor(client: GamerbotClient);
        graph: MarkovGraph;
        onReady(): Promise<void>;
        load(): Promise<void>;
        save(): Promise<void>;
        onMessageCreate(message: Message<boolean>): Promise<void>;
        addMessage(message: string): void;
        connections(seed: string): {
            [nextWord: string]: number;
        };
        generateMessage(length: number, seed?: string, guaranteed?: boolean): string;
        generateMessageRecursive(length: number, _words: string[]): string[] | null;
        getRandomWord(): string;
        getNextWord(word: string, exclude?: string[]): string | undefined;
        /** read all messages newer than the last time the graph was updated and add them to the graph */
        sync(): Promise<void>;
    }
}
declare module "gamerbot/lib/client/extensions/presence" {
    import type { PresenceData } from 'discord.js';
    import { GamerbotClient } from "gamerbot/lib/client/GamerbotClient";
    import { ClientExtension } from "gamerbot/lib/client/extensions/_extension";
    export default class PresenceExtension extends ClientExtension {
        #private;
        static cooldown: number;
        needsUpdate: boolean;
        destroyed: boolean;
        constructor(client: GamerbotClient);
        onReady(): Promise<void>;
        work(): void;
        destroy(): void;
        get presence(): PresenceData;
        set presence(data: PresenceData);
    }
}
declare module "gamerbot/lib/client/extensions/storage" {
    import fs from 'node:fs/promises';
    import { GamerbotClient } from "gamerbot/lib/client/GamerbotClient";
    import { ClientExtension } from "gamerbot/lib/client/extensions/_extension";
    export default class StorageExtension extends ClientExtension {
        constructor(client: GamerbotClient);
        read<T>(key: string, encoding?: BufferEncoding): Promise<T | undefined>;
        write(key: string, data: Parameters<typeof fs.writeFile>[1], encoding?: BufferEncoding): Promise<void>;
        delete(key: string): Promise<boolean>;
        list(): Promise<string[]>;
        stat(key: string): Promise<import('fs').Stats | undefined>;
        exists(key: string): Promise<boolean>;
    }
}
declare module "gamerbot/lib/types/trivia" {
    export interface CategoriesResponse {
        trivia_categories: Array<{
            id: number;
            name: string;
        }>;
    }
    export interface TriviaOptions {
        category?: number | string;
        type?: 'boolean' | 'multiple';
        difficulty?: 'easy' | 'medium' | 'hard';
    }
    export interface TriviaQuestion {
        category: string;
        type: 'boolean' | 'multiple';
        difficulty: 'easy' | 'medium' | 'hard';
        question: string;
        correct_answer: string;
        incorrect_answers: string[];
    }
    export const enum TriviaResponseType {
        Success = 0,
        NoResults = 1,
        InvalidParameters = 2,
        InvalidToken = 3,
        QuestionsExhausted = 4
    }
    export interface TriviaResponse {
        /**
         * #### Response Codes
         *
         * The API appends a "Response Code" to each API Call to help tell developers what the API is
         * doing.
         *
         * - Code 0: Success Returned results successfully.
         * - Code 1: No Results Could not return results. The API doesn't have enough questions for your
         *   query. (Ex. Asking for 50 Questions in a Category that only has 20.)
         * - Code 2: Invalid Parameter Contains an invalid parameter. Arguements passed in aren't valid.
         *   (Ex. Amount = Five)
         * - Code 3: Token Not Found Session Token does not exist.
         * - Code 4: Token Empty Session Token has returned all possible questions for the specified
         *   query. Resetting the Token is necessary.
         */
        response_code: 0 | 1 | 2 | 3 | 4;
        results: TriviaQuestion[];
    }
    export interface TokenRequestResponse {
        response_code: number;
        response_message: string;
        token: string;
    }
    export interface TokenResetResponse {
        response_code: number;
        token: string;
    }
}
declare module "gamerbot/lib/client/extensions/trivia" {
    import { CategoriesResponse, TriviaOptions, TriviaResponse } from "gamerbot/lib/types/trivia";
    import type { GamerbotClient } from "gamerbot/lib/client/GamerbotClient";
    import { ClientExtension } from "gamerbot/lib/client/extensions/_extension";
    export default class TriviaExtension extends ClientExtension {
        #private;
        constructor(client: GamerbotClient);
        onReady(): Promise<void>;
        resetToken(): Promise<boolean>;
        static getCategories(): Promise<CategoriesResponse['trivia_categories']>;
        fetchQuestion(options?: TriviaOptions): Promise<TriviaResponse>;
    }
}
declare module "gamerbot/lib/client/handleApplicationCommand" {
    import { Interaction, InteractionType } from 'discord.js';
    import { ClientContext } from "gamerbot/lib/client/ClientContext";
    import type { GamerbotClient } from "gamerbot/lib/client/GamerbotClient";
    export default function handleApplicationCommand(this: GamerbotClient, ctx: ClientContext, interaction: Extract<Interaction, {
        type: InteractionType.ApplicationCommand;
    }>): Promise<void>;
}
declare module "gamerbot/lib/client/handleAutocomplete" {
    import { AutocompleteInteraction } from 'discord.js';
    import { ClientContext } from "gamerbot/lib/client/ClientContext";
    import type { GamerbotClient } from "gamerbot/lib/client/GamerbotClient";
    export default function handleAutocomplete(this: GamerbotClient, ctx: ClientContext, interaction: AutocompleteInteraction): Promise<void>;
}
declare module "gamerbot/lib/types/urbandictionary" {
    export interface UrbanDictionaryResponse {
        list: UrbanDictionaryTerm[];
    }
    export interface UrbanDictionaryTerm {
        definition: string;
        permalink: string;
        thumbs_up: number;
        author: string;
        word: string;
        defid: number;
        current_vote: string;
        written_on: string;
        example: string;
        thumbs_down: number;
    }
}
declare module "gamerbot/lib/commands/messages/urban" {
    import { RepliableInteraction } from 'discord.js';
    import { CommandResult } from "gamerbot/lib/commands/command";
    const COMMAND_URBAN: import("gamerbot/lib/commands/command").ChatCommand;
    export const sendUrban: (interaction: RepliableInteraction, term: string) => Promise<CommandResult>;
    export default COMMAND_URBAN;
}
declare module "gamerbot/lib/commands/moderation/role" {
    import { ButtonInteraction } from 'discord.js';
    const COMMAND_ROLE: import("gamerbot/lib/commands/command").ChatCommand;
    export default COMMAND_ROLE;
    export const roleToggle: (interaction: ButtonInteraction) => Promise<void>;
}
declare module "gamerbot/lib/client/handleMessageComponent" {
    import { MessageComponentInteraction } from 'discord.js';
    import { ClientContext } from "gamerbot/lib/client/ClientContext";
    import type { GamerbotClient } from "gamerbot/lib/client/GamerbotClient";
    export default function handleMessageComponent(this: GamerbotClient, ctx: ClientContext, interaction: MessageComponentInteraction): Promise<void>;
}
declare module "gamerbot/lib/client/GamerbotClient" {
    import { Client, ClientOptions, ClientUser, Guild, Interaction, Message } from 'discord.js';
    import log4js from 'log4js';
    import { Command } from "gamerbot/lib/commands/command";
    import APIExtension from "gamerbot/lib/client/extensions/api";
    import CountsExtension from "gamerbot/lib/client/extensions/counts";
    import CustomEmojiExtension from "gamerbot/lib/client/extensions/customEmoji";
    import DeployExtension from "gamerbot/lib/client/extensions/deploy";
    import EggsExtension from "gamerbot/lib/client/extensions/eggs";
    import EvalExtension from "gamerbot/lib/client/extensions/eval";
    import FlagsExtension from "gamerbot/lib/client/extensions/flags";
    import MarkovExtension from "gamerbot/lib/client/extensions/markov";
    import PresenceExtension from "gamerbot/lib/client/extensions/presence";
    import StorageExtension from "gamerbot/lib/client/extensions/storage";
    import TriviaExtension from "gamerbot/lib/client/extensions/trivia";
    export interface GamerbotClientOptions extends Exclude<ClientOptions, 'intents'> {
    }
    export class GamerbotClient extends Client {
        #private;
        readonly user: ClientUser;
        readonly commands: Map<string, Command>;
        readonly ext: {
            api: APIExtension;
            counts: CountsExtension;
            customEmoji: CustomEmojiExtension;
            deploy: DeployExtension;
            eggs: EggsExtension;
            eval: EvalExtension;
            flags: FlagsExtension;
            markov: MarkovExtension;
            presence: PresenceExtension;
            storage: StorageExtension;
            trivia: TriviaExtension;
        };
        constructor(options?: GamerbotClientOptions);
        getLogger(category: string): log4js.Logger;
        ensureConfig(guildId: string): Promise<void>;
        onDebug(content: string): void;
        onMessageCreate(message: Message): Promise<void>;
        onGuildCreate(guild: Guild): Promise<void>;
        onGuildDelete(guild: Guild): Promise<void>;
        onInteractionCreate(interaction: Interaction): Promise<void>;
        startSentry(interaction: Interaction): void;
    }
}
declare module "gamerbot/lib/util/color" {
    export type ColorFormat = 'number' | 'hex' | 'plain' | 'rgb' | 'hsl';
    export type RgbTriple = [r: number, g: number, b: number];
    export type HslTriple = [h: number, s: number, l: number];
    export const hslToRgb: (h: number, s: number, l: number) => RgbTriple;
    export const rgbToHsl: (r: number, g: number, b: number) => HslTriple;
    export class Color {
        #private;
        static from(input: RgbTriple | HslTriple | number | string, type?: 'rgb' | 'hsl'): Color;
        constructor(num: number);
        get number(): number;
        get plain(): string;
        get rgb(): RgbTriple;
        get hsl(): HslTriple;
        get hex(): string;
    }
}
declare module "gamerbot/lib/util/embed" {
    import { APIEmbed, APIEmbedAuthor, APIEmbedFooter, APIEmbedProvider, EmbedBuilder, EmbedData, User } from 'discord.js';
    import { GamerbotClient } from "gamerbot/lib/client/GamerbotClient";
    import { Color } from "gamerbot/lib/util/color";
    type EmbedIntent = 'info' | 'success' | 'warning' | 'error';
    export interface EmbedOptions {
        noColor?: boolean;
        noAuthor?: boolean;
        intent?: EmbedIntent;
    }
    export const COLORS: {
        blue: Color;
        green: Color;
        red: Color;
        orange: Color;
    };
    export class Embed extends EmbedBuilder {
        #private;
        static setClient(client: GamerbotClient): void;
        static error(error: unknown): Embed;
        static error(message: string, description?: string): Embed;
        static warning(message: string, description?: string): Embed;
        static success(message: string, description?: string): Embed;
        static info(message: string, description?: string): Embed;
        constructor(options?: (EmbedBuilder | EmbedData | APIEmbed) & EmbedOptions);
        get title(): string | undefined;
        set title(title: string | undefined);
        get description(): string | undefined;
        set description(description: string | undefined);
        get url(): string | undefined;
        set url(url: string | undefined);
        get timestamp(): Date | undefined;
        set timestamp(timestamp: Date | undefined);
        get color(): number | undefined;
        set color(color: number | undefined);
        get footer(): APIEmbedFooter | undefined;
        set footer(footer: APIEmbedFooter | undefined);
        get image(): string | undefined;
        set image(image: string | undefined);
        get video(): string | undefined;
        get provider(): APIEmbedProvider | undefined;
        get author(): APIEmbedAuthor | undefined;
        set author(author: APIEmbedAuthor | undefined);
        get thumbnail(): string | undefined;
        set thumbnail(thumbnail: string | undefined);
        addField(name: string, value: string, inline?: boolean): this;
        set intent(intent: EmbedIntent);
        static profileAuthor(user: User, name?: string, url?: string): APIEmbedAuthor;
        static profileThumbnail(user: User): string;
    }
}
declare module "gamerbot/lib/commands/config/_configOption" {
    import type { Config, Prisma } from '@prisma/client';
    import type { APIInteractionDataResolvedChannel, APIRole } from 'discord-api-types/v9';
    import type { ApplicationCommandOptionChoiceData, CommandInteraction, Guild, GuildChannel, GuildMember, Role, ThreadChannel, User } from 'discord.js';
    import { ApplicationCommandOptionType } from 'discord.js';
    import type { CommandResult } from "gamerbot/lib/commands/command";
    import type { CommandContext } from "gamerbot/lib/commands/context";
    export type ConfigValueType = Exclude<ApplicationCommandOptionType, ApplicationCommandOptionType.Subcommand | ApplicationCommandOptionType.SubcommandGroup>;
    export type CommandContextWithGuild = CommandContext & {
        interaction: CommandInteraction & {
            guild: Guild;
            channel: GuildChannel;
            member: GuildMember;
        };
    };
    interface ConfigOptionDef<T extends ConfigValueType> {
        displayName: string;
        internalName: string;
        description: string;
        type: T;
        choices?: T extends ApplicationCommandOptionType.String | ApplicationCommandOptionType.Number | ApplicationCommandOptionType.Integer ? ApplicationCommandOptionChoiceData[] : never;
        handle: (context: CommandContextWithGuild, helpers: ConfigOptionHelpers<T>) => Promise<CommandResult>;
    }
    export type ConfigOption<T extends ConfigValueType> = ConfigOptionDef<T>;
    type CommandOptionTypeof<V extends ConfigValueType> = V extends ApplicationCommandOptionType.String ? string : V extends ApplicationCommandOptionType.Integer | ApplicationCommandOptionType.Number ? number : V extends ApplicationCommandOptionType.Boolean ? boolean : V extends ApplicationCommandOptionType.User ? User : V extends ApplicationCommandOptionType.Channel ? GuildChannel | ThreadChannel | APIInteractionDataResolvedChannel : V extends ApplicationCommandOptionType.Role ? Role | APIRole : V extends ApplicationCommandOptionType.Mentionable ? User | Role | GuildChannel : never;
    export interface ConfigOptionHelpers<V extends ConfigValueType> {
        getValue: () => CommandOptionTypeof<V> | null;
        getConfig: () => Promise<Config>;
        updateConfig: (data: Prisma.ConfigUpdateArgs['data']) => Promise<Config>;
    }
    export const helpers: <T extends ConfigValueType>(context: CommandContextWithGuild) => ConfigOptionHelpers<T>;
    export function configOption<T extends ConfigValueType>(def: ConfigOptionDef<T>): ConfigOption<T>;
}
declare module "gamerbot/lib/commands/config/_enableEgg" {
    import { ApplicationCommandOptionType } from 'discord.js';
    const CONFIG_OPTION_ENABLEEGG: import("gamerbot/lib/commands/config/_configOption").ConfigOption<ApplicationCommandOptionType.Boolean>;
    export default CONFIG_OPTION_ENABLEEGG;
}
declare module "gamerbot/lib/commands/config/config" {
    const COMMAND_CONFIG: import("gamerbot/lib/commands/command").ChatCommand;
    export default COMMAND_CONFIG;
}
declare module "gamerbot/lib/util/games" {
    import { ButtonInteraction, Message } from 'discord.js';
    import type { CommandContext } from "gamerbot/lib/commands/context";
    export interface ChallengeData {
        button: ButtonInteraction;
        message: Message;
    }
    export const challengePlayer: (interaction: CommandContext['interaction'], options: CommandContext['options'], gameName: string, emoji: string, wager?: number | null) => Promise<ChallengeData | undefined>;
}
declare module "gamerbot/lib/commands/games/_wager" {
    import { RepliableInteraction, Snowflake } from 'discord.js';
    export function canAfford(interaction: RepliableInteraction, userId: Snowflake, opponentId: Snowflake, wager: number): Promise<boolean>;
    export function transferEggs(source: Snowflake, destination: Snowflake, wager: number): Promise<void>;
}
declare module "gamerbot/lib/commands/games/connect4" {
    const COMMAND_CONNECT4: import("gamerbot/lib/commands/command").ChatCommand;
    export default COMMAND_CONNECT4;
}
declare module "gamerbot/lib/commands/games/dice" {
    const COMMAND_DICE: import("gamerbot/lib/commands/command").ChatCommand;
    export default COMMAND_DICE;
}
declare module "gamerbot/lib/commands/games/flags" {
    const COMMAND_FLAGS: import("gamerbot/lib/commands/command").ChatCommand;
    export default COMMAND_FLAGS;
}
declare module "gamerbot/lib/commands/games/rps" {
    const COMMAND_RPS: import("gamerbot/lib/commands/command").ChatCommand;
    export default COMMAND_RPS;
}
declare module "gamerbot/lib/commands/games/trivia" {
    const COMMAND_TRIVIA: import("gamerbot/lib/commands/command").ChatCommand;
    export default COMMAND_TRIVIA;
}
declare module "gamerbot/lib/commands/general/about" {
    const COMMAND_ABOUT: import("gamerbot/lib/commands/command").ChatCommand;
    export default COMMAND_ABOUT;
}
declare module "gamerbot/lib/commands/general/avatar" {
    const COMMAND_AVATAR: import("gamerbot/lib/commands/command").ChatCommand;
    export default COMMAND_AVATAR;
}
declare module "gamerbot/lib/commands/general/getavatar" {
    const COMMAND_GETAVATAR: import("gamerbot/lib/commands/command").UserCommand;
    export default COMMAND_GETAVATAR;
}
declare module "gamerbot/lib/commands/general/servericon" {
    const COMMAND_SERVERICON: import("gamerbot/lib/commands/command").ChatCommand;
    export default COMMAND_SERVERICON;
}
declare module "gamerbot/lib/commands/general/serverinfo" {
    const COMMAND_SERVERINFO: import("gamerbot/lib/commands/command").ChatCommand;
    export default COMMAND_SERVERINFO;
}
declare module "gamerbot/lib/commands/messages/cowsay" {
    const COMMAND_COWSAY: import("gamerbot/lib/commands/command").ChatCommand;
    export default COMMAND_COWSAY;
}
declare module "gamerbot/lib/commands/messages/eggleaderboard" {
    const COMMAND_EGGLEADERBOARD: import("gamerbot/lib/commands/command").ChatCommand;
    export default COMMAND_EGGLEADERBOARD;
}
declare module "gamerbot/lib/commands/messages/joke" {
    const COMMAND_JOKE: import("gamerbot/lib/commands/command").ChatCommand;
    export default COMMAND_JOKE;
}
declare module "gamerbot/lib/commands/messages/lmgtfy" {
    const COMMAND_LMGTFY: import("gamerbot/lib/commands/command").ChatCommand;
    export default COMMAND_LMGTFY;
}
declare module "gamerbot/lib/commands/messages/markov" {
    const COMMAND_MARKOV: import("gamerbot/lib/commands/command").ChatCommand;
    export default COMMAND_MARKOV;
}
declare module "gamerbot/lib/types/wikipedia" {
    export const userAgent: string;
    export interface WikipediaSearchResponse {
        pages: Page[];
    }
    export interface Page {
        /** Page identifier */
        id: number;
        /** Page title in URL-friendly format */
        key: string;
        /** Page title in reading-friendly format */
        title: string;
        /**
         * For [search pages endpoint](https://www.mediawiki.org/wiki/API:REST_API/Reference#Search_pages):
         * A few lines giving a sample of page content with search terms highlighted
         * with `<span class=\"searchmatch\">` tags
         *
         * For [autocomplete page title endpoint](https://www.mediawiki.org/wiki/API:REST_API/Reference#Autocomplete_page_title):
         * Page title in reading-friendly format
         */
        excerpt: string;
        /** The title of the page redirected from, if the search term originally matched a redirect page or null if search term did not match a redirect page */
        matched_title: string | null;
        /** Short summary of the page topic based on the corresponding entry on Wikidata or null if no entry exists */
        description: string | null;
        /** Information about the thumbnail image for the page or null if no thumbnail exists */
        thumbnail: Thumbnail | null;
    }
    /** Information about the thumbnail image for the page */
    export interface Thumbnail {
        /** Thumbnail [media type](https://en.wikipedia.org/wiki/Media_type) */
        mimetype: string;
        /** File size in bytes or `null` if not available */
        size: number | null;
        /** Maximum recommended image width in pixels or `null` if not available */
        width: number | null;
        /** Maximum recommended image height in pixels or `null` if not available */
        height: number | null;
        /** Length of the video, audio, or multimedia file or `null` for other media types */
        duration: number | null;
        /** URL to download the file */
        url: string;
    }
    /**
     * Query the Wikpedia REST API for search results.
     *
     * `'page'`: Searches wiki page titles and contents for the provided search
     * terms, and returns matching pages.
     *
     * `'title'`: Searches wiki page titles, and returns matches between the
     * beginning of a title and the provided search terms. You can use this endpoint
     * for a typeahead search that automatically suggests relevant pages by title.
     */
    export const search: (type: 'page' | 'title', query: string, limit?: number) => Promise<WikipediaSearchResponse>;
    export interface WikipediaPage {
        id: number;
        key: string;
        title: string;
        latest: Revision;
        content_model: string;
        license: License;
    }
    export interface Revision {
        id: number;
        timestamp: string;
    }
    export interface License {
        url: string;
        title: string;
    }
    export const getPage: (key: string) => Promise<WikipediaPage & {
        html_url: string;
    }>;
    export const getPageOffline: (key: string) => Promise<WikipediaPage & {
        html: string;
    }>;
    export interface SummaryResponse {
        batchcomplete: string;
        query: {
            pages: {
                [id: string]: SummaryPage;
            };
        };
    }
    export interface SummaryPage {
        pageid: number;
        ns: number;
        title: string;
        extract: string;
    }
    export const getSummary: (key: string) => Promise<string>;
}
declare module "gamerbot/lib/commands/messages/wiki" {
    const COMMAND_WIKI: import("gamerbot/lib/commands/command").ChatCommand;
    export default COMMAND_WIKI;
}
declare module "gamerbot/lib/commands/messages/xkcd" {
    const COMMAND_XKCD: import("gamerbot/lib/commands/command").ChatCommand;
    export default COMMAND_XKCD;
}
declare module "gamerbot/lib/util/regex" {
    export const usernameRegex: RegExp;
    export const uuidRegex: RegExp;
}
declare module "gamerbot/lib/util/minecraft" {
    export const resolveMinecraftUuid: (usernameOrUuid: string) => Promise<string | undefined>;
}
declare module "gamerbot/lib/commands/minecraft/skin" {
    const COMMAND_SKIN: import("gamerbot/lib/commands/command").ChatCommand;
    export default COMMAND_SKIN;
}
declare module "gamerbot/lib/style" {
    import { SKRSContext2D } from '@napi-rs/canvas';
    export const headerHeight = 44;
    export const subheaderHeight = 28;
    export const mainHeight = 40;
    export const padding = 16;
    export const margin = 0;
    export const fgColor = "#dfe0e4";
    export const fgAltColor = "#a8abb5";
    export const bgColor = "#1e2024";
    /**
     * @returns false when font was already present, otherwise true
     */
    export const assertFontLoaded: () => boolean;
    export const font: (px: number) => string;
    export const round: (num: number) => number;
    export const getCharWidth: (measure: number | SKRSContext2D, char?: string) => number;
}
declare module "gamerbot/lib/commands/minecraft/_statsProvider" {
    import type { Player } from '@calico32/hypixel-types';
    import type { Image } from '@napi-rs/canvas';
    export interface StatsProviderResponse {
        uuid: string;
        image: Buffer;
        metadata: {
            height: number;
            width: number;
            bytes: number;
            format: string;
        };
    }
    interface StatsProviderDef {
        displayName?: string;
        makeStats: (player: Player, avatar?: Image) => Promise<StatsProviderResponse>;
    }
    export interface StatsProvider extends StatsProviderDef {
        name: string;
        displayName: string;
    }
    export function statsProvider(name: string, def: StatsProviderDef): StatsProvider;
}
declare module "gamerbot/lib/commands/minecraft/_util/style" {
    import type { SKRSContext2D } from '@napi-rs/canvas';
    import { Color } from "gamerbot/lib/util/color";
    export const transaction: <T>(c: SKRSContext2D, f: () => T) => T;
    export const colors: {
        black: Color;
        dark_blue: Color;
        dark_green: Color;
        dark_aqua: Color;
        dark_red: Color;
        dark_purple: Color;
        gold: Color;
        gray: Color;
        dark_gray: Color;
        blue: Color;
        green: Color;
        aqua: Color;
        red: Color;
        light_purple: Color;
        yellow: Color;
        white: Color;
    };
    export const colorCode: (num: number) => Color;
    interface Text {
        color: Color;
        text: string;
    }
    export const parseFormattedText: (text: string, defaultStyle?: number) => Text[];
    export const stripFormatting: (text: string) => string;
    export const drawFormattedText: (c: SKRSContext2D, text: Text[] | string, x: number, y: number, textAlign?: 'left' | 'right') => number;
}
declare module "gamerbot/lib/commands/minecraft/_util/bedwarsPrestige" {
    import type { Player } from '@calico32/hypixel-types';
    import type { SKRSContext2D } from '@napi-rs/canvas';
    import type { Color } from "gamerbot/lib/util/color";
    export const EASY_LEVELS = 4;
    export const EASY_LEVELS_XP = 7000;
    export const XP_PER_PRESTIGE: number;
    export const LEVELS_PER_PRESTIGE = 100;
    export const getLevelForExp: (exp: number) => number;
    export const getExpForLevel: (level: number) => number;
    export const getLevelRespectingPrestige: (level: number) => number;
    export const prestigeColors: {
        [key: string]: Color[];
    };
    export const getStarSymbol: (level: number) => string;
    export const getPrestigePalette: (level: number) => Color[];
    export const getPrestigePlaintext: (player: Player) => string;
    export const drawPrestige: (c: SKRSContext2D, player: Player) => number;
}
declare module "gamerbot/lib/commands/minecraft/_util/rank" {
    import type { Player } from '@calico32/hypixel-types';
    import type { SKRSContext2D } from '@napi-rs/canvas';
    import type { Color } from "gamerbot/lib/util/color";
    export const rankWeights: {
        NON_DONOR: number;
        VIP: number;
        VIP_PLUS: number;
        MVP: number;
        MVP_PLUS: number;
        SUPERSTAR: number;
        YOUTUBER: number;
        JR_HELPER: number;
        HELPER: number;
        MODERATOR: number;
        ADMIN: number;
    };
    export type Rank = keyof typeof rankWeights;
    export const rankPrefixes: Record<Rank, string>;
    export const isStaff: (player: Player) => boolean;
    export const getRank: (player: Player) => Rank;
    export const getRankPlaintext: (player: Player) => string;
    export const drawRank: (c: SKRSContext2D, player: Player, x?: number, y?: number) => [width: number, nameColor: Color];
}
declare module "gamerbot/lib/commands/minecraft/_bedwars" {
    const STATS_PROVIDER_BEDWARS: import("gamerbot/lib/commands/minecraft/_statsProvider").StatsProvider;
    export default STATS_PROVIDER_BEDWARS;
}
declare module "gamerbot/lib/commands/minecraft/stats" {
    const COMMAND_STATS: import("gamerbot/lib/commands/command").ChatCommand;
    export default COMMAND_STATS;
}
declare module "gamerbot/lib/commands/minecraft/username" {
    const COMMAND_USERNAME: import("gamerbot/lib/commands/command").ChatCommand;
    export default COMMAND_USERNAME;
}
declare module "gamerbot/lib/commands/moderation/ban" {
    const COMMAND_BAN: import("gamerbot/lib/commands/command").ChatCommand;
    export default COMMAND_BAN;
}
declare module "gamerbot/lib/commands/moderation/kick" {
    const COMMAND_KICK: import("gamerbot/lib/commands/command").ChatCommand;
    export default COMMAND_KICK;
}
declare module "gamerbot/lib/commands/moderation/purgetohere" {
    import { CommandInteraction, ContextMenuCommandInteraction } from 'discord.js';
    import { CommandResult } from "gamerbot/lib/commands/command";
    export const purgeTo: (interaction: CommandInteraction | ContextMenuCommandInteraction, to: string) => Promise<CommandResult>;
    const COMMAND_PURGETOHERE: import("gamerbot/lib/commands/command").MessageCommand;
    export default COMMAND_PURGETOHERE;
}
declare module "gamerbot/lib/commands/moderation/purge" {
    const COMMAND_PURGE: import("gamerbot/lib/commands/command").ChatCommand;
    export default COMMAND_PURGE;
}
declare module "gamerbot/lib/commands/moderation/unban" {
    const COMMAND_UNBAN: import("gamerbot/lib/commands/command").ChatCommand;
    export default COMMAND_UNBAN;
}
declare module "gamerbot/lib/util/message" {
    import { MessageCreateOptions } from 'discord.js';
    export const parseDiscordJson: (json: string) => MessageCreateOptions;
}
declare module "gamerbot/lib/commands/utility/apimessage" {
    const COMMAND_APIMESSAGE: import("gamerbot/lib/commands/command").ChatCommand;
    export default COMMAND_APIMESSAGE;
}
declare module "gamerbot/lib/commands/utility/character" {
    const COMMAND_CHARACTER: import("gamerbot/lib/commands/command").ChatCommand;
    export default COMMAND_CHARACTER;
}
declare module "gamerbot/lib/commands/utility/color" {
    const COMMAND_COLOR: import("gamerbot/lib/commands/command").ChatCommand;
    export default COMMAND_COLOR;
}
declare module "gamerbot/lib/commands/utility/latex" {
    const COMMAND_LATEX: import("gamerbot/lib/commands/command").ChatCommand;
    export default COMMAND_LATEX;
}
declare module "gamerbot/lib/commands/utility/math" {
    const COMMAND_MATH: import("gamerbot/lib/commands/command").ChatCommand;
    export default COMMAND_MATH;
}
declare module "gamerbot/lib/commands/utility/ping" {
    const COMMAND_PING: import("gamerbot/lib/commands/command").ChatCommand;
    export default COMMAND_PING;
}
declare module "gamerbot/lib/commands/utility/_run/askForStdin" {
    import type { Runtime } from 'piston-client';
    import { CommandResult } from "gamerbot/lib/commands/command";
    import type { CommandContext } from "gamerbot/lib/commands/context";
    const askForStdin: (context: CommandContext, runtime: Runtime) => Promise<string | CommandResult>;
    export default askForStdin;
}
declare module "gamerbot/lib/commands/utility/_run/util" {
    import type { Attachment } from 'discord.js';
    export const isValidCodeAttachment: (attachment: Attachment) => boolean;
}
declare module "gamerbot/lib/commands/utility/_run/askForCode" {
    import type { Runtime } from 'piston-client';
    import { CommandResult } from "gamerbot/lib/commands/command";
    import type { CommandContext } from "gamerbot/lib/commands/context";
    const askForCode: (context: CommandContext, runtime: Runtime) => Promise<string | CommandResult>;
    export default askForCode;
}
declare module "gamerbot/lib/commands/utility/_run/getCode" {
    import type { Attachment } from 'discord.js';
    import type { Runtime } from 'piston-client';
    import { CommandResult } from "gamerbot/lib/commands/command";
    import type { CommandContext } from "gamerbot/lib/commands/context";
    interface GetCodeResult {
        attachment?: Attachment;
        code?: string;
        result?: CommandResult;
        error?: string;
    }
    const getCode: (context: CommandContext, runtime: Runtime) => Promise<GetCodeResult>;
    export default getCode;
}
declare module "gamerbot/lib/commands/utility/run" {
    const COMMAND_RUN: import("gamerbot/lib/commands/command").ChatCommand;
    export default COMMAND_RUN;
}
declare module "gamerbot/lib/commands/utility/_time/epoch" {
    import type { TimeHandler } from "gamerbot/lib/commands/utility/time";
    export const TIME_EPOCH: TimeHandler;
}
declare module "gamerbot/lib/commands/utility/_time/in" {
    import type { TimeHandler } from "gamerbot/lib/commands/utility/time";
    const TIME_IN: TimeHandler;
    export default TIME_IN;
}
declare module "gamerbot/lib/commands/utility/_time/world" {
    import type { TimeHandler } from "gamerbot/lib/commands/utility/time";
    const TIME_WORLD: TimeHandler;
    export default TIME_WORLD;
}
declare module "gamerbot/lib/commands/utility/_time/zoneinfo" {
    import type { TimeHandler } from "gamerbot/lib/commands/utility/time";
    const TIME_ZONEINFO: TimeHandler;
    export default TIME_ZONEINFO;
}
declare module "gamerbot/lib/commands/utility/time" {
    import { CommandResult } from "gamerbot/lib/commands/command";
    import type { CommandContext } from "gamerbot/lib/commands/context";
    export type TimeHandler = (context: CommandContext) => Promise<CommandResult>;
    const COMMAND_TIME: import("gamerbot/lib/commands/command").ChatCommand;
    export default COMMAND_TIME;
}
declare module "gamerbot/lib/commands/utility/timestamp" {
    const COMMAND_TIMESTAMP: import("gamerbot/lib/commands/command").ChatCommand;
    export default COMMAND_TIMESTAMP;
}
declare module "gamerbot/lib/commands" {
    export const DEFAULT_COMMANDS: (import("gamerbot/lib/commands/command").ChatCommand | import("gamerbot/lib/commands/command").UserCommand | import("gamerbot/lib/commands/command").MessageCommand)[];
}
declare module "gamerbot/lib/imagetest" { }
declare module "gamerbot/lib/index" {
    import 'source-map-support';
}
declare module "gamerbot/lib/commands/config/_allowSpam" {
    import { ApplicationCommandOptionType } from 'discord.js';
    const CONFIG_OPTION_ALLOWSPAM: import("gamerbot/lib/commands/config/_configOption").ConfigOption<ApplicationCommandOptionType.Boolean>;
    export default CONFIG_OPTION_ALLOWSPAM;
}
declare module "gamerbot/lib/commands/config/_log/addLogChannel" {
    import type { LogChannel } from '@prisma/client';
    import { ButtonInteraction } from 'discord.js';
    import { CommandResult } from "gamerbot/lib/commands/command";
    import type { CommandContextWithGuild } from "gamerbot/lib/commands/config/_configOption";
    const addLogChannel: (context: CommandContextWithGuild, logChannels: LogChannel[], component: ButtonInteraction) => Promise<CommandResult>;
    export default addLogChannel;
}
declare module "gamerbot/lib/commands/config/_log/editLogChannel" {
    import type { LogChannel } from '@prisma/client';
    import type { SelectMenuInteraction } from 'discord.js';
    import type { CommandResult } from "gamerbot/lib/commands/command";
    import type { CommandContextWithGuild } from "gamerbot/lib/commands/config/_configOption";
    const editLogChannel: (context: CommandContextWithGuild, logChannels: LogChannel[], component: SelectMenuInteraction) => Promise<CommandResult>;
    export default editLogChannel;
}
declare module "gamerbot/lib/commands/config/_log/removeLogChannel" {
    import type { LogChannel } from '@prisma/client';
    import type { SelectMenuInteraction } from 'discord.js';
    import type { CommandResult } from "gamerbot/lib/commands/command";
    import type { CommandContextWithGuild } from "gamerbot/lib/commands/config/_configOption";
    const removeLogChannel: (context: CommandContextWithGuild, logChannels: LogChannel[], component: SelectMenuInteraction) => Promise<CommandResult>;
    export default removeLogChannel;
}
declare module "gamerbot/lib/commands/config/_logChannels" {
    import { ApplicationCommandOptionType } from 'discord.js';
    const CONFIG_OPTION_LOGCHANNELS: import("gamerbot/lib/commands/config/_configOption").ConfigOption<ApplicationCommandOptionType.String>;
    export default CONFIG_OPTION_LOGCHANNELS;
}
declare module "gamerbot/lib/commands/minecraft/_util/networkLevel" {
    export const BASE = 10000;
    export const GROWTH = 2500;
    export const HALF_GROWTH: number;
    export const REVERSE_PQ_PREFIX: number;
    export const REVERSE_CONST: number;
    export const GROWTH_DIVIDES_2: number;
    export const getNetworkLevel: (xp: number) => number;
}
declare module "gamerbot/lib/log/constants" {
    import type { ClientEvents } from 'discord.js';
    export const allowedEvents: (keyof ClientEvents)[];
    export const eventsToBits: (events: ReadonlyArray<keyof ClientEvents>) => bigint;
    export const bitsToEvents: (bits: bigint) => ReadonlyArray<keyof ClientEvents>;
}
declare module "gamerbot/lib/log/handler" {
    import type { ClientEvents, Guild } from 'discord.js';
    import type { GamerbotClient } from "gamerbot/lib/client/GamerbotClient";
    import { Embed } from "gamerbot/lib/util/embed";
    interface LogHandlerContext {
        readonly client: GamerbotClient;
        readonly guild: Guild;
        readonly timestamp: Date;
    }
    interface ClientLogHandlerDef<T extends keyof ClientEvents> {
        event: T;
        run: (context: LogHandlerContext, ...args: ClientEvents[T]) => Promise<Embed>;
    }
    export type ClientLogHandler<T extends keyof ClientEvents> = ClientLogHandlerDef<T>;
    export function handler<T extends keyof ClientEvents>(def: ClientLogHandlerDef<T>): ClientLogHandler<T>;
}
declare module "gamerbot/scripts/docgen" { }
declare module "gamerbot/scripts/publish" { }
declare module "gamerbot/scripts/release" { }
declare module "gamerbot/scripts/version" { }
declare module "test/bedwars" { }
declare module "test/flags" { }

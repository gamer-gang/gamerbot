/// <reference types="node" resolution-mode="require"/>
/// <reference types="node" resolution-mode="require"/>
/// <reference lib="dom" />
declare module "gamerbot/src/util/color" {
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
declare module "gamerbot/src/util/discord" {
    import { Interaction, InteractionReplyOptions, MessagePayload, User } from 'discord.js';
    import { DateTime } from 'luxon';
    export const getDateStringFromSnowflake: (id: string) => [timestamp: string, age: string];
    export const getDateFromSnowflake: (id: string) => DateTime;
    export const getProfileImageUrl: (user: User) => string;
    export const interactionReplySafe: (interaction: Interaction, content: string | MessagePayload | InteractionReplyOptions) => Promise<void>;
}
declare module "gamerbot/src/constants" {
    export const IS_DEVELOPMENT: boolean;
    export const IS_DEBUG: boolean;
}
declare module "gamerbot/src/util/format" {
    import { CommandInteractionOption } from 'discord.js';
    export const formatOptions: (options: readonly CommandInteractionOption[]) => string;
    export const formatBytes: (bytes: number, decimals?: number) => string;
    export const formatUtcOffset: (offset: number) => string;
    export const formatErrorMessage: (err: unknown) => string;
}
declare module "gamerbot/src/util/embed" {
    import { APIEmbed, APIEmbedAuthor, APIEmbedFooter, APIEmbedProvider, EmbedBuilder, EmbedData, User } from 'discord.js';
    import { Color } from "gamerbot/src/util/color";
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
        static profileAuthor(name: string, user: User, url?: string): APIEmbedAuthor;
        static profileThumbnail(user: User): string;
    }
}
declare module "gamerbot/src/commands/context" {
    import type { PrismaClient } from '@prisma/client';
    import { BaseInteraction, ChatInputCommandInteraction, ContextMenuCommandInteraction, Message, MessageContextMenuCommandInteraction, User, UserContextMenuCommandInteraction } from 'discord.js';
    import type { GamerbotClient } from "gamerbot/src/client/GamerbotClient";
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
declare module "gamerbot/src/types/urbandictionary" {
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
declare module "gamerbot/src/commands/messages/urban" {
    import { RepliableInteraction } from 'discord.js';
    import { CommandResult } from "gamerbot/src/commands/command";
    const COMMAND_URBAN: import("gamerbot/src/commands/command").ChatCommand;
    export const sendUrban: (interaction: RepliableInteraction, term: string) => Promise<CommandResult>;
    export default COMMAND_URBAN;
}
declare module "gamerbot/src/util/path" {
    export const resolvePath: (dir: string) => string;
}
declare module "gamerbot/src/logger" {
    export const initLogger: () => void;
}
declare module "gamerbot/src/prisma" {
    import Prisma from '@prisma/client';
    export const prisma: Prisma.PrismaClient<{
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
    }, "info" | "error" | "query" | "warn", false>;
}
declare module "gamerbot/src/util" {
    import { TimeZone } from '@vvo/tzdb';
    import { ApplicationCommandOptionChoiceData, CommandInteraction, ContextMenuCommandInteraction } from 'discord.js';
    import type { Command } from "gamerbot/src/commands/command";
    import type { ChatCommandDef, MessageCommandDef, UserCommandDef } from "gamerbot/src/types";
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
declare module "gamerbot/src/client/_analytics/types" {
    import type { CommandType as DatabaseCommandType } from '@prisma/client';
    export interface CommandReportStats {
        type: DatabaseCommandType;
        sent: number;
        successful: number;
        failed: number;
        users: Set<string>;
    }
    export const defaultCommandStats: (type: DatabaseCommandType) => CommandReportStats;
}
declare module "gamerbot/src/client/_analytics/event" {
    import type { CommandType as DatabaseCommandType } from '@prisma/client';
    import type { AnalyticsManager } from "gamerbot/src/client/AnalyticsManager";
    export enum AnalyticsEvent {
        /**
         * Should be tracked when the client connects to the gateway.
         */
        BotLogin = 0,
        /**
         * Should be tracked when a command is sent and will be executed.
         */
        CommandSent = 1,
        /**
         * Should be tracked when a command is executed successfully (see {@link CommandResult.Success}).
         */
        CommandSuccess = 2,
        /**
         * Should be tracked when a command fails (see {@link CommandResult.Failure}).
         */
        CommandFailure = 3
    }
    export interface EventData {
        [AnalyticsEvent.BotLogin]: [];
        [AnalyticsEvent.CommandSent]: [command: string, type: DatabaseCommandType, user: string];
        [AnalyticsEvent.CommandSuccess]: [command: string, type: DatabaseCommandType];
        [AnalyticsEvent.CommandFailure]: [command: string, type: DatabaseCommandType];
    }
    export interface AnalyticsEventReturn {
        [AnalyticsEvent.CommandSent]: number;
    }
    export type EventReturnType<E extends AnalyticsEvent> = E extends keyof AnalyticsEventReturn ? AnalyticsEventReturn[E] : void;
    export const events: {
        [E in AnalyticsEvent]: (manager: AnalyticsManager, ...data: EventData[E]) => EventReturnType<E>;
    };
}
declare module "gamerbot/src/client/AnalyticsManager" {
    import type { AnalyticsReport, CommandReport, CommandType as DatabaseCommandType } from '@prisma/client';
    import { Command, CommandResult } from "gamerbot/src/commands/command";
    import type { GamerbotClient } from "gamerbot/src/client/GamerbotClient";
    import { AnalyticsEvent, EventData, EventReturnType } from "gamerbot/src/client/_analytics/event";
    import type { CommandReportStats } from "gamerbot/src/client/_analytics/types";
    export class AnalyticsManager {
        #private;
        client: GamerbotClient;
        get initialized(): boolean;
        get report(): AnalyticsReport;
        usersInteracted: Set<string>;
        commandCache: Map<string, CommandReportStats>;
        constructor(client: GamerbotClient);
        initialize(force?: boolean): Promise<void>;
        flushAll(): Promise<void>;
        update(): Promise<void>;
        /** Push global analytics changes to the database */
        flushGlobal(): Promise<void>;
        /** Push all command changes to the database and clear the cache. */
        flushCommands(): Promise<void>;
        hashUser(userId: string): string;
        getCommandReport(command: string, type: DatabaseCommandType): Promise<CommandReport>;
        trackEvent<E extends AnalyticsEvent>(event: E, ...data: EventData[E]): EventReturnType<E>;
        trackCommandResult(result: CommandResult, command: Command): void;
    }
}
declare module "gamerbot/src/client/ClientStorage" {
    import fs from 'node:fs/promises';
    export class ClientStorage {
        constructor();
        read<T>(key: string, encoding?: BufferEncoding): Promise<T | undefined>;
        write(key: string, data: Parameters<typeof fs.writeFile>[1], encoding?: BufferEncoding): Promise<void>;
        delete(key: string): Promise<boolean>;
        list(): Promise<string[]>;
        stat(key: string): Promise<import('fs').Stats | undefined>;
        exists(key: string): Promise<boolean>;
    }
}
declare module "gamerbot/src/client/CountManager" {
    import type { Client } from 'discord.js';
    import { Logger } from 'log4js';
    export class CountManager {
        #private;
        readonly client: Client;
        logger: Logger;
        constructor(client: Client);
        countGuilds(): Promise<number>;
        countUsers(): Promise<number>;
        update(): Promise<void>;
    }
}
declare module "gamerbot/src/client/MarkovManager" {
    import { GamerbotClient } from "gamerbot/src/client/GamerbotClient";
    interface MarkovGraph {
        timestamp: number;
        words: {
            [startingWord: string]: {
                [nextWord: string]: number;
            };
        };
    }
    export class MarkovManager {
        #private;
        readonly client: GamerbotClient;
        constructor(client: GamerbotClient);
        graph: MarkovGraph;
        load(): Promise<void>;
        save(): Promise<void>;
        addMessage(message: string): void;
        generateMessage(length: number, seed?: string, guaranteed?: boolean): string;
        generateMessageRecursive(length: number, _words: string[]): string[] | null;
        getRandomWord(): string;
        getNextWord(word: string, exclude?: string[]): string | undefined;
        /** read all messages newer than the last time the graph was updated and add them to the graph */
        sync(): Promise<void>;
    }
}
declare module "gamerbot/src/client/PresenceManager" {
    import type { Client, PresenceData } from 'discord.js';
    export class PresenceManager {
        #private;
        static cooldown: number;
        worker: NodeJS.Timeout;
        constructor(client: Client);
        destroy(): void;
        get destroyed(): boolean;
        get needsUpdate(): boolean;
        get presence(): PresenceData;
        set presence(data: PresenceData);
    }
}
declare module "gamerbot/src/types/trivia" {
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
declare module "gamerbot/src/client/TriviaManager" {
    import type { Logger } from 'log4js';
    import { CategoriesResponse, TriviaOptions, TriviaResponse } from "gamerbot/src/types/trivia";
    import type { GamerbotClient } from "gamerbot/src/client/GamerbotClient";
    export class TriviaManager {
        #private;
        readonly client: GamerbotClient;
        logger: Logger;
        constructor(client: GamerbotClient);
        resetToken(): Promise<boolean>;
        static getCategories(): Promise<CategoriesResponse['trivia_categories']>;
        fetchQuestion(options?: TriviaOptions): Promise<TriviaResponse>;
    }
}
declare module "gamerbot/src/client/egg" {
    import { Message, PartialMessage } from 'discord.js';
    import type { GamerbotClient } from "gamerbot/src/client/GamerbotClient";
    export const hasEggs: (msg: Message | PartialMessage) => boolean;
    export const getTotal: () => Promise<bigint>;
    export const onMessage: (client: GamerbotClient, message: Message | PartialMessage) => Promise<void>;
}
declare module "gamerbot/src/client/GamerbotClient" {
    import { Client, ClientOptions, ClientUser, Guild, Interaction, Message } from 'discord.js';
    import log4js from 'log4js';
    import { Command } from "gamerbot/src/commands/command";
    import { AnalyticsManager } from "gamerbot/src/client/AnalyticsManager";
    import { ClientStorage } from "gamerbot/src/client/ClientStorage";
    import { CountManager } from "gamerbot/src/client/CountManager";
    import { MarkovManager } from "gamerbot/src/client/MarkovManager";
    import { PresenceManager } from "gamerbot/src/client/PresenceManager";
    import { TriviaManager } from "gamerbot/src/client/TriviaManager";
    export interface GamerbotClientOptions extends Exclude<ClientOptions, 'intents'> {
    }
    export class GamerbotClient extends Client {
        #private;
        readonly user: ClientUser;
        readonly commands: Map<string, Command>;
        readonly presenceManager: PresenceManager;
        readonly analytics: AnalyticsManager;
        readonly countManager: CountManager;
        readonly triviaManager: TriviaManager;
        readonly markov: MarkovManager;
        readonly storage: ClientStorage;
        constructor(options?: GamerbotClientOptions);
        getLogger(category: string): log4js.Logger;
        refreshPresence(): Promise<void>;
        ensureConfig(guildId: string): Promise<void>;
        countUsers: () => Promise<number>;
        countGuilds: () => Promise<number>;
        onDebug(content: string): void;
        onMessageCreate(message: Message): Promise<void>;
        onGuildCreate(guild: Guild): Promise<void>;
        onGuildDelete(guild: Guild): Promise<void>;
        onInteractionCreate(interaction: Interaction): Promise<void>;
    }
}
declare module "gamerbot/src/types" {
    import type { ApplicationCommandOptionChoiceData, ApplicationCommandOptionData, ApplicationCommandType, AutocompleteInteraction, ChatInputCommandInteraction, Guild, GuildChannel, GuildMember, Interaction, MessageContextMenuCommandInteraction, PermissionsString, UserContextMenuCommandInteraction } from 'discord.js';
    import { GamerbotClient } from "gamerbot/src/client/GamerbotClient";
    import type { ChatCommand, CommandResult, MessageCommand, UserCommand } from "gamerbot/src/commands/command";
    import type { BaseContext, CommandContext, MessageCommandContext, UserCommandContext } from "gamerbot/src/commands/context";
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
    export const enum KnownInteractions {
        UrbanDefine = "urban_define"
    }
}
declare module "gamerbot/src/commands/command" {
    import { ApplicationCommandType } from 'discord.js';
    import type { ChatCommandDef, CommandDefinitionType, CommandObjectType, MessageCommandDef, UserCommandDef } from "gamerbot/src/types";
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
         * Denotes successful execution of the command. This includes user errors, such as a missing
         * option or bad value.
         */
        Success = 0,
        /**
         * Denotes a failure to fulfill execution of the command. Typicall an error that is not caused by
         * the user, such as a failed request to an external API, logic error, etc.
         */
        Failure = 1
    }
    function command<T extends ApplicationCommandType>(type: T, def: CommandDefinitionType[T]): CommandObjectType[T];
    export default command;
}
declare module "gamerbot/src/commands/config/_configOption" {
    import type { Config, Prisma } from '@prisma/client';
    import type { APIInteractionDataResolvedChannel, APIRole } from 'discord-api-types/v9';
    import type { ApplicationCommandOptionChoiceData, CommandInteraction, Guild, GuildChannel, GuildMember, Role, ThreadChannel, User } from 'discord.js';
    import { ApplicationCommandOptionType } from 'discord.js';
    import type { CommandResult } from "gamerbot/src/commands/command";
    import type { CommandContext } from "gamerbot/src/commands/context";
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
declare module "gamerbot/src/commands/config/_enableEgg" {
    import { ApplicationCommandOptionType } from 'discord.js';
    const CONFIG_OPTION_ENABLEEGG: import("gamerbot/src/commands/config/_configOption").ConfigOption<ApplicationCommandOptionType.Boolean>;
    export default CONFIG_OPTION_ENABLEEGG;
}
declare module "gamerbot/src/commands/config/config" {
    const COMMAND_CONFIG: import("gamerbot/src/commands/command").ChatCommand;
    export default COMMAND_CONFIG;
}
declare module "gamerbot/src/util/games" {
    import { ButtonInteraction, Message } from 'discord.js';
    import type { CommandContext } from "gamerbot/src/commands/context";
    export interface ChallengeData {
        button: ButtonInteraction;
        message: Message;
    }
    export const challengePlayer: (interaction: CommandContext['interaction'], options: CommandContext['options'], gameName: string, emoji: string) => Promise<ChallengeData | undefined>;
}
declare module "gamerbot/src/commands/games/connect4" {
    const COMMAND_CONNECT4: import("gamerbot/src/commands/command").ChatCommand;
    export default COMMAND_CONNECT4;
}
declare module "gamerbot/src/commands/games/dice" {
    const COMMAND_DICE: import("gamerbot/src/commands/command").ChatCommand;
    export default COMMAND_DICE;
}
declare module "gamerbot/src/commands/games/rps" {
    const COMMAND_RPS: import("gamerbot/src/commands/command").ChatCommand;
    export default COMMAND_RPS;
}
declare module "gamerbot/src/commands/games/trivia" {
    const COMMAND_TRIVIA: import("gamerbot/src/commands/command").ChatCommand;
    export default COMMAND_TRIVIA;
}
declare module "gamerbot/src/commands/general/about" {
    const COMMAND_ABOUT: import("gamerbot/src/commands/command").ChatCommand;
    export default COMMAND_ABOUT;
}
declare module "gamerbot/src/commands/general/analytics" {
    const COMMAND_ANALYTICS: import("gamerbot/src/commands/command").ChatCommand;
    export default COMMAND_ANALYTICS;
}
declare module "gamerbot/src/commands/general/avatar" {
    const COMMAND_AVATAR: import("gamerbot/src/commands/command").ChatCommand;
    export default COMMAND_AVATAR;
}
declare module "gamerbot/src/commands/general/getavatar" {
    const COMMAND_GETAVATAR: import("gamerbot/src/commands/command").UserCommand;
    export default COMMAND_GETAVATAR;
}
declare module "gamerbot/src/commands/general/servericon" {
    const COMMAND_SERVERICON: import("gamerbot/src/commands/command").ChatCommand;
    export default COMMAND_SERVERICON;
}
declare module "gamerbot/src/commands/general/serverinfo" {
    const COMMAND_SERVERINFO: import("gamerbot/src/commands/command").ChatCommand;
    export default COMMAND_SERVERINFO;
}
declare module "gamerbot/src/commands/general/uptime" {
    const COMMAND_UPTIME: import("gamerbot/src/commands/command").ChatCommand;
    export default COMMAND_UPTIME;
}
declare module "gamerbot/src/commands/messages/cowsay" {
    const COMMAND_COWSAY: import("gamerbot/src/commands/command").ChatCommand;
    export default COMMAND_COWSAY;
}
declare module "gamerbot/src/commands/messages/eggleaderboard" {
    const COMMAND_EGGLEADERBOARD: import("gamerbot/src/commands/command").ChatCommand;
    export default COMMAND_EGGLEADERBOARD;
}
declare module "gamerbot/src/commands/messages/joke" {
    const COMMAND_JOKE: import("gamerbot/src/commands/command").ChatCommand;
    export default COMMAND_JOKE;
}
declare module "gamerbot/src/commands/messages/lmgtfy" {
    const COMMAND_LMGTFY: import("gamerbot/src/commands/command").ChatCommand;
    export default COMMAND_LMGTFY;
}
declare module "gamerbot/src/commands/messages/markov" {
    const COMMAND_MARKOV: import("gamerbot/src/commands/command").ChatCommand;
    export default COMMAND_MARKOV;
}
declare module "gamerbot/src/types/wikipedia" {
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
declare module "gamerbot/src/commands/messages/wiki" {
    const COMMAND_WIKI: import("gamerbot/src/commands/command").ChatCommand;
    export default COMMAND_WIKI;
}
declare module "gamerbot/src/commands/messages/xkcd" {
    const COMMAND_XKCD: import("gamerbot/src/commands/command").ChatCommand;
    export default COMMAND_XKCD;
}
declare module "gamerbot/src/util/regex" {
    export const usernameRegex: RegExp;
    export const uuidRegex: RegExp;
}
declare module "gamerbot/src/util/minecraft" {
    export const resolveMinecraftUuid: (usernameOrUuid: string) => Promise<string | undefined>;
}
declare module "gamerbot/src/commands/minecraft/skin" {
    const COMMAND_SKIN: import("gamerbot/src/commands/command").ChatCommand;
    export default COMMAND_SKIN;
}
declare module "gamerbot/src/style" {
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
declare module "gamerbot/src/commands/minecraft/_statsProvider" {
    import type { Image } from '@napi-rs/canvas';
    import type { Player } from 'hypixel-types';
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
declare module "gamerbot/src/commands/minecraft/_util/style" {
    import type { SKRSContext2D } from '@napi-rs/canvas';
    import { Color } from "gamerbot/src/util/color";
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
declare module "gamerbot/src/commands/minecraft/_util/bedwarsPrestige" {
    import type { SKRSContext2D } from '@napi-rs/canvas';
    import type { Player } from 'hypixel-types';
    import type { Color } from "gamerbot/src/util/color";
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
declare module "gamerbot/src/commands/minecraft/_util/rank" {
    import type { SKRSContext2D } from '@napi-rs/canvas';
    import type { Player } from 'hypixel-types';
    import type { Color } from "gamerbot/src/util/color";
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
declare module "gamerbot/src/commands/minecraft/_bedwars" {
    const STATS_PROVIDER_BEDWARS: import("gamerbot/src/commands/minecraft/_statsProvider").StatsProvider;
    export default STATS_PROVIDER_BEDWARS;
}
declare module "gamerbot/src/commands/minecraft/stats" {
    const COMMAND_STATS: import("gamerbot/src/commands/command").ChatCommand;
    export default COMMAND_STATS;
}
declare module "gamerbot/src/commands/minecraft/username" {
    const COMMAND_USERNAME: import("gamerbot/src/commands/command").ChatCommand;
    export default COMMAND_USERNAME;
}
declare module "gamerbot/src/commands/moderation/ban" {
    const COMMAND_BAN: import("gamerbot/src/commands/command").ChatCommand;
    export default COMMAND_BAN;
}
declare module "gamerbot/src/commands/moderation/kick" {
    const COMMAND_KICK: import("gamerbot/src/commands/command").ChatCommand;
    export default COMMAND_KICK;
}
declare module "gamerbot/src/commands/moderation/purgetohere" {
    import { CommandInteraction, ContextMenuCommandInteraction } from 'discord.js';
    import { CommandResult } from "gamerbot/src/commands/command";
    export const purgeTo: (interaction: CommandInteraction | ContextMenuCommandInteraction, to: string) => Promise<CommandResult>;
    const COMMAND_PURGETOHERE: import("gamerbot/src/commands/command").MessageCommand;
    export default COMMAND_PURGETOHERE;
}
declare module "gamerbot/src/commands/moderation/purge" {
    const COMMAND_PURGE: import("gamerbot/src/commands/command").ChatCommand;
    export default COMMAND_PURGE;
}
declare module "gamerbot/src/commands/moderation/role" {
    const COMMAND_ROLE: import("gamerbot/src/commands/command").ChatCommand;
    export default COMMAND_ROLE;
}
declare module "gamerbot/src/commands/moderation/unban" {
    const COMMAND_UNBAN: import("gamerbot/src/commands/command").ChatCommand;
    export default COMMAND_UNBAN;
}
declare module "gamerbot/src/util/message" {
    import { MessageCreateOptions } from 'discord.js';
    export const parseDiscordJson: (json: string) => MessageCreateOptions;
}
declare module "gamerbot/src/commands/utility/apimessage" {
    const COMMAND_APIMESSAGE: import("gamerbot/src/commands/command").ChatCommand;
    export default COMMAND_APIMESSAGE;
}
declare module "gamerbot/src/commands/utility/character" {
    const COMMAND_CHARACTER: import("gamerbot/src/commands/command").ChatCommand;
    export default COMMAND_CHARACTER;
}
declare module "gamerbot/src/commands/utility/color" {
    const COMMAND_COLOR: import("gamerbot/src/commands/command").ChatCommand;
    export default COMMAND_COLOR;
}
declare module "gamerbot/src/commands/utility/latex" {
    const COMMAND_LATEX: import("gamerbot/src/commands/command").ChatCommand;
    export default COMMAND_LATEX;
}
declare module "gamerbot/src/commands/utility/math" {
    const COMMAND_MATH: import("gamerbot/src/commands/command").ChatCommand;
    export default COMMAND_MATH;
}
declare module "gamerbot/src/commands/utility/ping" {
    const COMMAND_PING: import("gamerbot/src/commands/command").ChatCommand;
    export default COMMAND_PING;
}
declare module "gamerbot/src/commands/utility/_run/askForStdin" {
    import type { Runtime } from 'piston-client';
    import { CommandResult } from "gamerbot/src/commands/command";
    import type { CommandContext } from "gamerbot/src/commands/context";
    const askForStdin: (context: CommandContext, runtime: Runtime) => Promise<string | CommandResult>;
    export default askForStdin;
}
declare module "gamerbot/src/commands/utility/_run/util" {
    import type { Attachment } from 'discord.js';
    export const isValidCodeAttachment: (attachment: Attachment) => boolean;
}
declare module "gamerbot/src/commands/utility/_run/askForCode" {
    import type { Runtime } from 'piston-client';
    import { CommandResult } from "gamerbot/src/commands/command";
    import type { CommandContext } from "gamerbot/src/commands/context";
    const askForCode: (context: CommandContext, runtime: Runtime) => Promise<string | CommandResult>;
    export default askForCode;
}
declare module "gamerbot/src/commands/utility/_run/getCode" {
    import type { Attachment } from 'discord.js';
    import type { Runtime } from 'piston-client';
    import { CommandResult } from "gamerbot/src/commands/command";
    import type { CommandContext } from "gamerbot/src/commands/context";
    interface GetCodeResult {
        attachment?: Attachment;
        code?: string;
        result?: CommandResult;
        error?: string;
    }
    const getCode: (context: CommandContext, runtime: Runtime) => Promise<GetCodeResult>;
    export default getCode;
}
declare module "gamerbot/src/commands/utility/run" {
    const COMMAND_RUN: import("gamerbot/src/commands/command").ChatCommand;
    export default COMMAND_RUN;
}
declare module "gamerbot/src/commands/utility/_time/epoch" {
    import type { TimeHandler } from "gamerbot/src/commands/utility/time";
    export const TIME_EPOCH: TimeHandler;
}
declare module "gamerbot/src/commands/utility/_time/in" {
    import type { TimeHandler } from "gamerbot/src/commands/utility/time";
    const TIME_IN: TimeHandler;
    export default TIME_IN;
}
declare module "gamerbot/src/commands/utility/_time/world" {
    import type { TimeHandler } from "gamerbot/src/commands/utility/time";
    const TIME_WORLD: TimeHandler;
    export default TIME_WORLD;
}
declare module "gamerbot/src/commands/utility/_time/zoneinfo" {
    import type { TimeHandler } from "gamerbot/src/commands/utility/time";
    const TIME_ZONEINFO: TimeHandler;
    export default TIME_ZONEINFO;
}
declare module "gamerbot/src/commands/utility/time" {
    import { CommandResult } from "gamerbot/src/commands/command";
    import type { CommandContext } from "gamerbot/src/commands/context";
    export type TimeHandler = (context: CommandContext) => Promise<CommandResult>;
    const COMMAND_TIME: import("gamerbot/src/commands/command").ChatCommand;
    export default COMMAND_TIME;
}
declare module "gamerbot/src/commands/utility/timestamp" {
    const COMMAND_TIMESTAMP: import("gamerbot/src/commands/command").ChatCommand;
    export default COMMAND_TIMESTAMP;
}
declare module "gamerbot/src/commands" {
    export const DEFAULT_COMMANDS: (import("gamerbot/src/commands/command").ChatCommand | import("gamerbot/src/commands/command").UserCommand | import("gamerbot/src/commands/command").MessageCommand)[];
}
declare module "gamerbot/src/deploy" {
    import type { GamerbotClient } from "gamerbot/src/client/GamerbotClient";
    export const deployCommands: (client: GamerbotClient) => Promise<void>;
}
declare module "gamerbot/src/docgen" { }
declare module "gamerbot/src/imagetest" { }
declare module "gamerbot/src/index" { }
declare module "gamerbot/src/client/Plugin" {
    import type { Command } from "gamerbot/src/commands/command";
    export abstract class Plugin {
        abstract id: string;
        commands: Command[];
    }
}
declare module "gamerbot/src/commands/config/_allowSpam" {
    import { ApplicationCommandOptionType } from 'discord.js';
    const CONFIG_OPTION_ALLOWSPAM: import("gamerbot/src/commands/config/_configOption").ConfigOption<ApplicationCommandOptionType.Boolean>;
    export default CONFIG_OPTION_ALLOWSPAM;
}
declare module "gamerbot/src/commands/config/_log/addLogChannel" {
    import type { LogChannel } from '@prisma/client';
    import { ButtonInteraction } from 'discord.js';
    import { CommandResult } from "gamerbot/src/commands/command";
    import type { CommandContextWithGuild } from "gamerbot/src/commands/config/_configOption";
    const addLogChannel: (context: CommandContextWithGuild, logChannels: LogChannel[], component: ButtonInteraction) => Promise<CommandResult>;
    export default addLogChannel;
}
declare module "gamerbot/src/commands/config/_log/editLogChannel" {
    import type { LogChannel } from '@prisma/client';
    import type { SelectMenuInteraction } from 'discord.js';
    import type { CommandResult } from "gamerbot/src/commands/command";
    import type { CommandContextWithGuild } from "gamerbot/src/commands/config/_configOption";
    const editLogChannel: (context: CommandContextWithGuild, logChannels: LogChannel[], component: SelectMenuInteraction) => Promise<CommandResult>;
    export default editLogChannel;
}
declare module "gamerbot/src/commands/config/_log/removeLogChannel" {
    import type { LogChannel } from '@prisma/client';
    import type { SelectMenuInteraction } from 'discord.js';
    import type { CommandResult } from "gamerbot/src/commands/command";
    import type { CommandContextWithGuild } from "gamerbot/src/commands/config/_configOption";
    const removeLogChannel: (context: CommandContextWithGuild, logChannels: LogChannel[], component: SelectMenuInteraction) => Promise<CommandResult>;
    export default removeLogChannel;
}
declare module "gamerbot/src/commands/config/_logChannels" {
    import { ApplicationCommandOptionType } from 'discord.js';
    const CONFIG_OPTION_LOGCHANNELS: import("gamerbot/src/commands/config/_configOption").ConfigOption<ApplicationCommandOptionType.String>;
    export default CONFIG_OPTION_LOGCHANNELS;
}
declare module "gamerbot/src/commands/minecraft/_util/networkLevel" {
    export const BASE = 10000;
    export const GROWTH = 2500;
    export const HALF_GROWTH: number;
    export const REVERSE_PQ_PREFIX: number;
    export const REVERSE_CONST: number;
    export const GROWTH_DIVIDES_2: number;
    export const getNetworkLevel: (xp: number) => number;
}
declare module "gamerbot/src/log/constants" {
    import type { ClientEvents } from 'discord.js';
    export const allowedEvents: (keyof ClientEvents)[];
    export const eventsToBits: (events: ReadonlyArray<keyof ClientEvents>) => bigint;
    export const bitsToEvents: (bits: bigint) => ReadonlyArray<keyof ClientEvents>;
}
declare module "gamerbot/src/log/handler" {
    import type { ClientEvents, Guild } from 'discord.js';
    import type { GamerbotClient } from "gamerbot/src/client/GamerbotClient";
    import { Embed } from "gamerbot/src/util/embed";
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
declare module "gamerbot/scripts/bedwars" { }

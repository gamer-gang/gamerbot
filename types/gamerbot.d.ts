/// <reference types="node" />
declare module "src/commands/context" {
    import { PrismaClient } from '@prisma/client';
    import { CommandInteraction, ContextMenuInteraction, Interaction, Message, User } from 'discord.js';
    import { GamerbotClient } from "src/GamerbotClient";
    export class BaseContext {
        readonly interaction: Interaction;
        readonly prisma: PrismaClient;
        readonly client: GamerbotClient;
        constructor(client: GamerbotClient, interaction: Interaction, prisma: PrismaClient);
        get user(): Interaction['user'];
        get member(): Interaction['member'];
        get channel(): Interaction['channel'];
        get guild(): Interaction['guild'];
        get createdTimestamp(): Interaction['createdTimestamp'];
    }
    export class CommandContext extends BaseContext {
        readonly interaction: CommandInteraction;
        constructor(client: GamerbotClient, interaction: CommandInteraction, prisma: PrismaClient);
        get options(): CommandInteraction['options'];
    }
    class ContextMenuCommandContext extends BaseContext {
        readonly interaction: ContextMenuInteraction;
        constructor(client: GamerbotClient, interaction: ContextMenuInteraction, prisma: PrismaClient);
        get options(): ContextMenuInteraction['options'];
    }
    export class UserCommandContext extends ContextMenuCommandContext {
        get targetUser(): User;
    }
    export class MessageCommandContext extends ContextMenuCommandContext {
        get targetMessage(): Message;
    }
}
declare module "src/types" {
    import { ApplicationCommandOptionChoice, ApplicationCommandOptionData, ApplicationCommandType, AutocompleteInteraction, CommandInteraction, ContextMenuInteraction, Guild, GuildChannel, GuildMember, Interaction, PermissionString } from 'discord.js';
    import type { CommandResult } from "src/commands/command";
    import { BaseContext, CommandContext, MessageCommandContext, UserCommandContext } from "src/commands/context";
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
        userPermissions?: PermissionString[];
        /**
         * Array of permissions for the bot for this command. Command will not be executed if the bot does
         * not have these permissions.
         */
        botPermissions?: PermissionString[];
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
    export type ChatCommandDef = CommandType<CommandContext, CommandInteraction, {
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
        autocomplete?: (interaction: AutocompleteInteraction) => Promise<ApplicationCommandOptionChoice[]>;
    }>;
    export type UserCommandDef = CommandType<UserCommandContext, ContextMenuInteraction>;
    export type MessageCommandDef = CommandType<MessageCommandContext, ContextMenuInteraction>;
    export interface DocsJson {
        version: string;
        commands: Array<{
            name: string;
            type: ApplicationCommandType;
            description: string;
            longDescription: string;
            examples: CommandExample[];
            options: ApplicationCommandOptionData[];
            guildOnly: boolean;
            logUsage: boolean;
            userPermissions: PermissionString[];
            botPermissions: PermissionString[];
        }>;
    }
}
declare module "src/util/color" {
    export type ColorFormat = 'number' | 'hex' | 'plain' | 'rgb' | 'hsl';
    export type RgbTriple = [r: number, g: number, b: number];
    export type HslTriple = [h: number, s: number, l: number];
    export class Color {
        #private;
        private readonly num;
        static from(input: RgbTriple | HslTriple | number | string, type?: 'rgb' | 'hsl'): Color;
        constructor(num: number);
        get asNumber(): number;
        get plain(): string;
        get rgb(): RgbTriple;
        get hsl(): HslTriple;
        get hex(): string;
    }
}
declare module "src/util/discord" {
    import { Interaction, InteractionReplyOptions, MessagePayload, User } from 'discord.js';
    import { DateTime } from 'luxon';
    export const getDateStringFromSnowflake: (id: string) => [timestamp: string, age: string];
    export const getDateFromSnowflake: (id: string) => DateTime;
    export const getProfileImageUrl: (user: User) => string;
    export const interactionReplySafe: (interaction: Interaction, content: string | MessagePayload | InteractionReplyOptions) => Promise<void>;
}
declare module "src/constants" {
    export const IS_DEVELOPMENT: boolean;
    export const IS_DEBUG: boolean;
}
declare module "src/util/message" {
    import { MessageOptions } from 'discord.js';
    export const parseDiscordJson: (json: string) => MessageOptions;
    export const formatErrorMessage: (err: unknown) => string;
}
declare module "src/util/embed" {
    import { MessageEmbed, MessageEmbedOptions, User } from 'discord.js';
    import { Color } from "src/util/color";
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
    export class Embed extends MessageEmbed {
        static error(error: unknown): Embed;
        static error(message: string, description?: string): Embed;
        static warning(message: string, description?: string): Embed;
        static success(message: string, description?: string): Embed;
        static info(message: string, description?: string): Embed;
        constructor(options?: (MessageEmbed | MessageEmbedOptions) & EmbedOptions);
        setIntent(intent: EmbedIntent): this;
        setAuthorToProfile(name: string, user: User, url?: string): this;
        setThumbnailToProfileImage(user: User): this;
    }
}
declare module "src/util" {
    import { TimeZone } from '@vvo/tzdb';
    import { ApplicationCommandOptionChoice, CommandInteraction, CommandInteractionOption, ContextMenuInteraction } from 'discord.js';
    import { Command } from "src/commands/command";
    import { ChatCommandDef, MessageCommandDef, UserCommandDef } from "src/types";
    export const formatOptions: (options: readonly CommandInteractionOption[]) => string;
    export const isChatCommand: (def: ChatCommandDef | UserCommandDef | MessageCommandDef) => def is ChatCommandDef;
    export const formatBytes: (bytes: number, decimals?: number) => string;
    export const insertUuidDashes: (uuid: string) => string;
    export const hasPermissions: (interaction: CommandInteraction | ContextMenuInteraction, command: Command) => boolean;
    export const matchString: (input: string, possible: string[]) => ApplicationCommandOptionChoice[];
    export const formatUtcOffset: (offset: number) => string;
    export const findTimeZone: (input: string) => TimeZone | undefined;
}
declare module "src/commands/command" {
    import { ChatCommandDef, MessageCommandDef, UserCommandDef } from "src/types";
    export type ChatCommand = Required<ChatCommandDef> & {
        type: 'CHAT_INPUT';
    };
    export type UserCommand = Required<UserCommandDef> & {
        type: 'USER';
    };
    export type MessageCommand = Required<MessageCommandDef> & {
        type: 'MESSAGE';
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
    function command(type: 'CHAT_INPUT', def: ChatCommandDef): ChatCommand;
    function command(type: 'USER', def: UserCommandDef): UserCommand;
    function command(type: 'MESSAGE', def: MessageCommandDef): MessageCommand;
    export default command;
}
declare module "src/util/path" {
    export const resolvePath: (dir: string) => string;
}
declare module "src/logger" {
    export const initLogger: () => void;
}
declare module "src/prisma" {
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
    }, "info" | "query" | "warn" | "error", false>;
}
declare module "src/analytics/types" {
    import { CommandType as DatabaseCommandType } from '@prisma/client';
    export interface CommandReportStats {
        type: DatabaseCommandType;
        sent: number;
        successful: number;
        failed: number;
        users: Set<string>;
    }
    export const defaultCommandStats: (type: DatabaseCommandType) => CommandReportStats;
}
declare module "src/analytics/manager" {
    import { AnalyticsReport, CommandReport, CommandType as DatabaseCommandType } from '@prisma/client';
    import type { GamerbotClient } from "src/GamerbotClient";
    import { AnalyticsEvent, EventData, EventReturnType } from "src/analytics/event";
    import { CommandReportStats } from "src/analytics/types";
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
    }
}
declare module "src/analytics/event" {
    import { CommandType as DatabaseCommandType } from '@prisma/client';
    import type { AnalyticsManager } from "src/analytics/manager";
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
declare module "src/commands/config/_configOption" {
    import { Config, Prisma } from '@prisma/client';
    import { APIInteractionDataResolvedChannel, APIRole } from 'discord-api-types';
    import { ApplicationCommandOptionChoice, ApplicationCommandOptionType, CommandInteraction, Guild, GuildChannel, GuildMember, Role, ThreadChannel, User } from 'discord.js';
    import { CommandResult } from "src/commands/command";
    import { CommandContext } from "src/commands/context";
    export type ConfigValueType = Exclude<ApplicationCommandOptionType, 'SUB_COMMAND' | 'SUB_COMMAND_GROUP'>;
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
        choices?: T extends 'STRING' | 'INTEGER' | 'NUMBER' ? ApplicationCommandOptionChoice[] : never;
        handle: (context: CommandContextWithGuild, helpers: ConfigOptionHelpers<T>) => Promise<CommandResult>;
    }
    export type ConfigOption<T extends ConfigValueType> = ConfigOptionDef<T>;
    type CommandOptionTypeof<V extends ConfigValueType> = V extends 'STRING' ? string : V extends 'INTEGER' ? number : V extends 'BOOLEAN' ? boolean : V extends 'USER' ? User : V extends 'CHANNEL' ? GuildChannel | ThreadChannel | APIInteractionDataResolvedChannel : V extends 'ROLE' ? Role | APIRole : V extends 'MENTIONABLE' ? User | Role | GuildChannel : V extends 'NUMBER' ? number : never;
    export interface ConfigOptionHelpers<V extends ConfigValueType> {
        getValue: () => CommandOptionTypeof<V> | null;
        getConfig: () => Promise<Config>;
        updateConfig: (data: Prisma.ConfigUpdateArgs['data']) => Promise<Config>;
    }
    export const helpers: <T extends ConfigValueType>(context: CommandContextWithGuild) => ConfigOptionHelpers<T>;
    export function configOption<T extends ConfigValueType>(def: ConfigOptionDef<T>): ConfigOption<T>;
}
declare module "src/commands/config/_enableEgg" {
    const CONFIG_OPTION_ENABLEEGG: import("src/commands/config/_configOption").ConfigOption<"BOOLEAN">;
    export default CONFIG_OPTION_ENABLEEGG;
}
declare module "src/commands/config/config" {
    const COMMAND_CONFIG: import("src/commands/command").ChatCommand;
    export default COMMAND_CONFIG;
}
declare module "src/commands/games/dice" {
    const COMMAND_DICE: import("src/commands/command").ChatCommand;
    export default COMMAND_DICE;
}
declare module "src/commands/games/rps" {
    const COMMAND_RPS: import("src/commands/command").ChatCommand;
    export default COMMAND_RPS;
}
declare module "src/commands/general/about" {
    const COMMAND_ABOUT: import("src/commands/command").ChatCommand;
    export default COMMAND_ABOUT;
}
declare module "src/commands/general/analytics" {
    const COMMAND_ANALYTICS: import("src/commands/command").ChatCommand;
    export default COMMAND_ANALYTICS;
}
declare module "src/commands/general/avatar" {
    const COMMAND_AVATAR: import("src/commands/command").ChatCommand;
    export default COMMAND_AVATAR;
}
declare module "src/commands/general/getavatar" {
    const COMMAND_GETAVATAR: import("src/commands/command").UserCommand;
    export default COMMAND_GETAVATAR;
}
declare module "src/commands/general/servericon" {
    const COMMAND_SERVERICON: import("src/commands/command").ChatCommand;
    export default COMMAND_SERVERICON;
}
declare module "src/commands/general/serverinfo" {
    const COMMAND_SERVERINFO: import("src/commands/command").ChatCommand;
    export default COMMAND_SERVERINFO;
}
declare module "src/commands/messages/cowsay" {
    const COMMAND_COWSAY: import("src/commands/command").ChatCommand;
    export default COMMAND_COWSAY;
}
declare module "src/commands/messages/eggleaderboard" {
    const COMMAND_EGGLEADERBOARD: import("src/commands/command").ChatCommand;
    export default COMMAND_EGGLEADERBOARD;
}
declare module "src/commands/messages/lmgtfy" {
    const COMMAND_LMGTFY: import("src/commands/command").ChatCommand;
    export default COMMAND_LMGTFY;
}
declare module "src/commands/messages/xkcd" {
    const COMMAND_XKCD: import("src/commands/command").ChatCommand;
    export default COMMAND_XKCD;
}
declare module "src/util/regex" {
    export const usernameRegex: RegExp;
    export const uuidRegex: RegExp;
}
declare module "src/style" {
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
declare module "src/commands/minecraft/_statsProvider" {
    import { Image } from '@napi-rs/canvas';
    import { Player } from 'hypixel-types';
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
declare module "src/commands/minecraft/_util/style" {
    import { SKRSContext2D } from '@napi-rs/canvas';
    import { Color } from "src/util/color";
    export const transaction: <T>(c: SKRSContext2D, f: () => T) => T;
    export const colors: {
        [key: string]: Color;
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
declare module "src/commands/minecraft/_util/bedwarsPrestige" {
    import { SKRSContext2D } from '@napi-rs/canvas';
    import { Player } from 'hypixel-types';
    import { Color } from "src/util/color";
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
declare module "src/commands/minecraft/_util/rank" {
    import { SKRSContext2D } from '@napi-rs/canvas';
    import { Player } from 'hypixel-types';
    import { Color } from "src/util/color";
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
declare module "src/commands/minecraft/_bedwars" {
    const STATS_PROVIDER_BEDWARS: import("src/commands/minecraft/_statsProvider").StatsProvider;
    export default STATS_PROVIDER_BEDWARS;
}
declare module "src/commands/minecraft/stats" {
    const COMMAND_STATS: import("src/commands/command").ChatCommand;
    export default COMMAND_STATS;
}
declare module "src/commands/minecraft/username" {
    const COMMAND_USERNAME: import("src/commands/command").ChatCommand;
    export default COMMAND_USERNAME;
}
declare module "src/commands/moderation/ban" {
    const COMMAND_BAN: import("src/commands/command").ChatCommand;
    export default COMMAND_BAN;
}
declare module "src/commands/moderation/kick" {
    const COMMAND_KICK: import("src/commands/command").ChatCommand;
    export default COMMAND_KICK;
}
declare module "src/commands/moderation/purgetohere" {
    import { CommandInteraction, ContextMenuInteraction } from 'discord.js';
    import { CommandResult } from "src/commands/command";
    export const purgeTo: (interaction: CommandInteraction | ContextMenuInteraction, to: string) => Promise<CommandResult>;
    const COMMAND_PURGETOHERE: import("src/commands/command").MessageCommand;
    export default COMMAND_PURGETOHERE;
}
declare module "src/commands/moderation/purge" {
    const COMMAND_PURGE: import("src/commands/command").ChatCommand;
    export default COMMAND_PURGE;
}
declare module "src/commands/moderation/role" {
    const COMMAND_ROLE: import("src/commands/command").ChatCommand;
    export default COMMAND_ROLE;
}
declare module "src/commands/moderation/unban" {
    const COMMAND_UNBAN: import("src/commands/command").ChatCommand;
    export default COMMAND_UNBAN;
}
declare module "src/commands/utility/apimessage" {
    const COMMAND_APIMESSAGE: import("src/commands/command").ChatCommand;
    export default COMMAND_APIMESSAGE;
}
declare module "src/commands/utility/character" {
    const COMMAND_CHARACTER: import("src/commands/command").ChatCommand;
    export default COMMAND_CHARACTER;
}
declare module "src/commands/utility/color" {
    const COMMAND_COLOR: import("src/commands/command").ChatCommand;
    export default COMMAND_COLOR;
}
declare module "src/commands/utility/latex" {
    const COMMAND_LATEX: import("src/commands/command").ChatCommand;
    export default COMMAND_LATEX;
}
declare module "src/commands/utility/math" {
    const COMMAND_MATH: import("src/commands/command").ChatCommand;
    export default COMMAND_MATH;
}
declare module "src/commands/utility/ping" {
    const COMMAND_PING: import("src/commands/command").ChatCommand;
    export default COMMAND_PING;
}
declare module "src/commands/utility/_run/askForCode" {
    import { Runtime } from 'piston-client';
    import { CommandResult } from "src/commands/command";
    import { CommandContext } from "src/commands/context";
    const askForCode: (context: CommandContext, runtime: Runtime) => Promise<string | CommandResult>;
    export default askForCode;
}
declare module "src/commands/utility/_run/askForStdin" {
    import { Runtime } from 'piston-client';
    import { CommandResult } from "src/commands/command";
    import { CommandContext } from "src/commands/context";
    const askForStdin: (context: CommandContext, runtime: Runtime) => Promise<string | CommandResult>;
    export default askForStdin;
}
declare module "src/commands/utility/run" {
    const COMMAND_RUN: import("src/commands/command").ChatCommand;
    export default COMMAND_RUN;
}
declare module "src/commands/utility/_time/epoch" {
    import { TimeHandler } from "src/commands/utility/time";
    export const TIME_EPOCH: TimeHandler;
}
declare module "src/commands/utility/_time/in" {
    import { TimeHandler } from "src/commands/utility/time";
    const TIME_IN: TimeHandler;
    export default TIME_IN;
}
declare module "src/commands/utility/_time/world" {
    import type { TimeHandler } from "src/commands/utility/time";
    const TIME_WORLD: TimeHandler;
    export default TIME_WORLD;
}
declare module "src/commands/utility/_time/zoneinfo" {
    import { TimeHandler } from "src/commands/utility/time";
    const TIME_ZONEINFO: TimeHandler;
    export default TIME_ZONEINFO;
}
declare module "src/commands/utility/time" {
    import { CommandResult } from "src/commands/command";
    import { CommandContext } from "src/commands/context";
    export type TimeHandler = (context: CommandContext) => Promise<CommandResult>;
    const COMMAND_TIME: import("src/commands/command").ChatCommand;
    export default COMMAND_TIME;
}
declare module "src/commands/utility/timestamp" {
    const COMMAND_TIMESTAMP: import("src/commands/command").ChatCommand;
    export default COMMAND_TIMESTAMP;
}
declare module "src/egg" {
    import { Message, PartialMessage } from 'discord.js';
    import { GamerbotClient } from "src/GamerbotClient";
    export const hasEggs: (msg: Message | PartialMessage) => boolean;
    export const getTotal: () => Promise<BigInt>;
    export const onMessage: (client: GamerbotClient, message: Message | PartialMessage) => Promise<void>;
}
declare module "src/Plugin" {
    import { Command } from "src/commands/command";
    export abstract class Plugin {
        abstract id: string;
        commands: Command[];
    }
}
declare module "src/util/presence" {
    import { Client, PresenceData } from 'discord.js';
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
declare module "src/GamerbotClient" {
    import { Client, ClientOptions, ClientUser, Guild, Interaction, Message } from 'discord.js';
    import log4js from 'log4js';
    import { AnalyticsManager } from "src/analytics/manager";
    import { Command } from "src/commands/command";
    import { Plugin } from "src/Plugin";
    import { PresenceManager } from "src/util/presence";
    export interface GamerbotClientOptions extends Exclude<ClientOptions, 'intents'> {
        plugins?: Plugin[];
    }
    export class GamerbotClient extends Client {
        #private;
        readonly user: ClientUser;
        getLogger(category: string): log4js.Logger;
        readonly commands: Map<string, Command>;
        readonly presenceManager: PresenceManager;
        readonly analytics: AnalyticsManager;
        static readonly DEFAULT_COMMANDS: (import("src/commands/command").ChatCommand | import("src/commands/command").UserCommand | import("src/commands/command").MessageCommand)[];
        constructor(options?: GamerbotClientOptions);
        registerPlugins(...plugins: Plugin[]): void;
        refreshPresence(): Promise<void>;
        countGuilds(): Promise<number>;
        countUsers(): Promise<number>;
        onDebug(content: string): void;
        onMessage(message: Message): Promise<void>;
        ensureConfig(guildId: string): Promise<void>;
        onGuildCreate(guild: Guild): Promise<void>;
        onGuildDelete(guild: Guild): Promise<void>;
        onInteraction(interaction: Interaction): Promise<void>;
    }
}
declare module "src/deploy" {
    import { GamerbotClient } from "src/GamerbotClient";
    export const deployCommands: (client: GamerbotClient) => Promise<void>;
}
declare module "src/docgen" { }
declare module "src/imagetest" { }
declare module "src/index" { }
declare module "src/commands/config/_allowSpam" {
    const CONFIG_OPTION_ALLOWSPAM: import("src/commands/config/_configOption").ConfigOption<"BOOLEAN">;
    export default CONFIG_OPTION_ALLOWSPAM;
}
declare module "src/commands/config/_log/addLogChannel" {
    import { LogChannel } from '@prisma/client';
    import { ButtonInteraction } from 'discord.js';
    import { CommandResult } from "src/commands/command";
    import { CommandContextWithGuild } from "src/commands/config/_configOption";
    const addLogChannel: (context: CommandContextWithGuild, logChannels: LogChannel[], component: ButtonInteraction) => Promise<CommandResult>;
    export default addLogChannel;
}
declare module "src/commands/config/_log/editLogChannel" {
    import { LogChannel } from '@prisma/client';
    import { SelectMenuInteraction } from 'discord.js';
    import { CommandResult } from "src/commands/command";
    import { CommandContextWithGuild } from "src/commands/config/_configOption";
    const editLogChannel: (context: CommandContextWithGuild, logChannels: LogChannel[], component: SelectMenuInteraction) => Promise<CommandResult>;
    export default editLogChannel;
}
declare module "src/commands/config/_log/removeLogChannel" {
    import { LogChannel } from '@prisma/client';
    import { SelectMenuInteraction } from 'discord.js';
    import { CommandResult } from "src/commands/command";
    import { CommandContextWithGuild } from "src/commands/config/_configOption";
    const removeLogChannel: (context: CommandContextWithGuild, logChannels: LogChannel[], component: SelectMenuInteraction) => Promise<CommandResult>;
    export default removeLogChannel;
}
declare module "src/commands/config/_logChannels" {
    const CONFIG_OPTION_LOGCHANNELS: import("src/commands/config/_configOption").ConfigOption<"STRING">;
    export default CONFIG_OPTION_LOGCHANNELS;
}
declare module "src/commands/minecraft/_util/networkLevel" {
    export const BASE = 10000;
    export const GROWTH = 2500;
    export const HALF_GROWTH: number;
    export const REVERSE_PQ_PREFIX: number;
    export const REVERSE_CONST: number;
    export const GROWTH_DIVIDES_2: number;
    export const getNetworkLevel: (xp: number) => number;
}
declare module "src/log/constants" {
    import { ClientEvents } from 'discord.js';
    export const allowedEvents: (keyof ClientEvents)[];
    export const eventsToBits: (events: ReadonlyArray<keyof ClientEvents>) => bigint;
    export const bitsToEvents: (bits: bigint) => ReadonlyArray<keyof ClientEvents>;
}
declare module "src/log/handler" {
    import { ClientEvents, Guild } from 'discord.js';
    import { GamerbotClient } from "src/GamerbotClient";
    import { Embed } from "src/util/embed";
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

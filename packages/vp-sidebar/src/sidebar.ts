import type { UserConfig } from 'vitepress';
import { readFileSync, readdirSync, statSync, existsSync } from 'fs';
import { join, resolve } from 'path';
import matter from 'gray-matter';
import fg from 'fast-glob';

export declare interface VitePressSidebarOptions {
  documentRootPath?: string;
  scanStartPath?: string;
  resolvePath?: string;
  basePath?: string;
  collapsed?: boolean | null | undefined;
  collapseDepth?: number;
  hyphenToSpace?: boolean;
  underscoreToSpace?: boolean;
  capitalizeFirst?: boolean;
  capitalizeEachWords?: boolean;
  includeRootIndexFile?: boolean;
  includeFolderIndexFile?: boolean;
  useTitleFromFileHeading?: boolean;
  useTitleFromFrontmatter?: boolean;
  useFolderTitleFromIndexFile?: boolean;
  useFolderLinkFromIndexFile?: boolean;
  useFolderLinkFromSameNameSubFile?: boolean;
  includeDotFiles?: boolean;
  folderLinkNotIncludesFileName?: boolean;
  includeEmptyFolder?: boolean;
  sortMenusByName?: boolean;
  sortMenusByFrontmatterOrder?: boolean;
  sortMenusByFrontmatterDate?: boolean;
  sortMenusByFileDatePrefix?: boolean;
  sortMenusOrderByDescending?: boolean;
  sortMenusOrderNumericallyFromTitle?: boolean;
  sortMenusOrderNumericallyFromLink?: boolean;
  sortFolderTo?: null | undefined | 'top' | 'bottom';
  keepMarkdownSyntaxFromTitle?: boolean;
  debugPrint?: boolean;
  manualSortFileNameByPriority?: string[];
  excludePattern?: string[];
  excludeFilesByFrontmatterFieldNames?: string[];
  removePrefixAfterOrdering?: boolean;
  prefixSeparator?: string | RegExp;
  rootGroupText?: string;
  rootGroupLink?: string;
  rootGroupCollapsed?: boolean | null | undefined;
  frontmatterOrderDefaultValue?: number;
  frontmatterTitleFieldName?: string;
  /**
   * @private This option is only used internally. Use the `debugPrint` option instead.
   */
  debugPrintFromWithSidebar?: boolean;
  /**
   * @deprecated use `excludePattern` option instead. This option will be removed in a future version.
   */
  excludeFiles?: string[];
  /**
   * @deprecated use `excludePattern` option instead. This option will be removed in a future version.
   */
  excludeFolders?: string[];
  /**
   * @deprecated use `useFolderLinkFromSameNameSubFile` instead. This option will be removed in a future version.
   */
  convertSameNameSubFileToGroupIndexPage?: boolean;
}

declare interface SidebarListItem {
  [key: string]: any;
}

declare interface SortByObjectKeyOptions {
  arr: SidebarListItem;
  key: string;
  desc?: boolean;
  numerically?: boolean;
  datePrefixSeparator?: string | RegExp;
  dateSortFromFrontmatter?: boolean;
  dateSortFromTextWithPrefix?: boolean;
}

declare type AnyValueObject = { [key: string]: any };

/*
 * Types from: `vitepress/types/default-theme.d.ts`
 */
export type SidebarItem = {
  text?: string;
  link?: string;
  items?: SidebarItem[];
  collapsed?: boolean;
};

export interface SidebarMultiItem {
  base: string;
  items: SidebarItem[];
}

export interface SidebarMulti {
  [path: string]: SidebarMultiItem;
}

export type Sidebar = SidebarItem[] | SidebarMulti;
/*
 * End
 * */

export default class VitePressSidebar {
  static withSidebar(
    vitePressOptions: UserConfig,
    sidebarOptions?: VitePressSidebarOptions | VitePressSidebarOptions[]
  ): Partial<UserConfig> {
    let optionItems: (VitePressSidebarOptions | undefined)[];

    if (sidebarOptions === undefined) {
      optionItems = [{}];
    } else {
      optionItems = Array.isArray(sidebarOptions) ? sidebarOptions : [sidebarOptions];
    }

    let enableDebugPrint = false;

    optionItems.forEach((optionItem) => {
      if (optionItem?.debugPrint && !enableDebugPrint) {
        enableDebugPrint = true;
        optionItem.debugPrint = false;
      }
    });

    const sidebarResult: Partial<UserConfig> = {
      themeConfig: {
        sidebar: VitePressSidebar.generateSidebar(sidebarOptions)
      }
    };

    if (vitePressOptions?.themeConfig?.sidebar) {
      vitePressOptions.themeConfig.sidebar = {};
    }

    const result: Partial<UserConfig> = VitePressSidebar.objMergeNewKey(
      vitePressOptions,
      sidebarResult
    ) as UserConfig;

    if (enableDebugPrint) {
      VitePressSidebar.debugPrint(sidebarOptions, result);
    }

    return result;
  }

  static generateSidebar(options?: VitePressSidebarOptions | VitePressSidebarOptions[]): Sidebar {
    const sidebar: Sidebar = {};
    const isMultipleSidebars = Array.isArray(options);
    let enableDebugPrint = false;
    let optionItems: (VitePressSidebarOptions | undefined)[];

    if (arguments.length > 1) {
      throw new Error(`You must pass 1 argument, see the documentation for details.`);
    }

    if (options === undefined) {
      optionItems = [{}];
    } else {
      optionItems = Array.isArray(options) ? options : [options];
    }

    for (let i = 0; i < optionItems.length; i += 1) {
      const optionItem = optionItems[i]!;

      // Exceptions for changed option names
      if (
        VitePressSidebar.isTrueMinimumNumberOfTimes(
          [
            optionItem.sortMenusByFrontmatterOrder,
            optionItem.sortMenusByName,
            optionItem.sortMenusByFileDatePrefix
          ],
          2
        )
      ) {
        throw new Error(
          VitePressSidebar.generateNotTogetherMessage([
            'sortMenusByFrontmatterOrder',
            'sortMenusByName',
            'sortMenusByFileDatePrefix'
          ])
        );
      }
      if (
        VitePressSidebar.isTrueMinimumNumberOfTimes(
          [
            optionItem.sortMenusByFrontmatterOrder,
            optionItem.sortMenusOrderNumericallyFromTitle,
            optionItem.sortMenusOrderNumericallyFromLink
          ],
          2
        )
      ) {
        throw new Error(
          VitePressSidebar.generateNotTogetherMessage([
            'sortMenusByFrontmatterOrder',
            'sortMenusOrderNumericallyFromTitle',
            'sortMenusOrderNumericallyFromLink'
          ])
        );
      }
      if (
        VitePressSidebar.isTrueMinimumNumberOfTimes(
          [optionItem.sortMenusByFrontmatterOrder, optionItem.sortMenusByFrontmatterDate],
          2
        )
      ) {
        throw new Error(
          VitePressSidebar.generateNotTogetherMessage([
            'sortMenusByFrontmatterOrder',
            'sortMenusByFrontmatterDate'
          ])
        );
      }
      if (optionItem.removePrefixAfterOrdering && !optionItem.prefixSeparator) {
        throw new Error(`'prefixSeparator' should not use empty string`);
      }

      if (optionItem.debugPrint && !enableDebugPrint) {
        enableDebugPrint = true;
      }

      optionItem.documentRootPath = optionItem?.documentRootPath ?? '/';

      if (!/^\//.test(optionItem.documentRootPath)) {
        optionItem.documentRootPath = `/${optionItem.documentRootPath}`;
      }

      if (optionItem.collapseDepth) {
        optionItem.collapsed = true;
      }

      if (!optionItem.prefixSeparator) {
        optionItem.prefixSeparator = '.';
      }

      optionItem.collapseDepth = optionItem?.collapseDepth ?? 1;
      optionItem.manualSortFileNameByPriority = optionItem?.manualSortFileNameByPriority ?? [];
      optionItem.excludePattern = optionItem?.excludePattern ?? [];
      optionItem.frontmatterOrderDefaultValue = optionItem?.frontmatterOrderDefaultValue ?? 0;

      let scanPath = optionItem.documentRootPath;

      if (optionItem.scanStartPath) {
        scanPath = `${optionItem.documentRootPath}/${optionItem.scanStartPath}`
          .replace(/\/{2,}/g, '/')
          .replace('/$', '');
      }

      let sidebarResult: SidebarListItem = VitePressSidebar.generateSidebarItem(
        1,
        join(process.cwd(), scanPath),
        scanPath,
        null,
        optionItem
      );

      if (optionItem.removePrefixAfterOrdering) {
        sidebarResult = VitePressSidebar.removePrefixFromTitleAndLink(sidebarResult, optionItem);
      }

      sidebar[optionItem.resolvePath || '/'] = {
        base: optionItem.basePath || optionItem.resolvePath || '/',
        items:
          sidebarResult?.items ||
          (optionItem.rootGroupText ||
            optionItem.rootGroupLink ||
            optionItem.rootGroupCollapsed === true ||
            optionItem.rootGroupCollapsed === false
            ? [
              {
                text: optionItem.rootGroupText,
                ...(optionItem.rootGroupLink ? { link: optionItem.rootGroupLink } : {}),
                items: sidebarResult as SidebarItem[],
                ...(optionItem.rootGroupCollapsed === null
                  ? {}
                  : { collapsed: optionItem.rootGroupCollapsed })
              }
            ]
            : (sidebarResult as SidebarItem[]))
      };
    }

    let sidebarResult;

    if (!isMultipleSidebars && Object.keys(sidebar).length === 1) {
      // Single sidebar
      sidebarResult = Object.values(sidebar)[0].items;
    } else {
      // Multiple sidebars
      sidebarResult = sidebar;
    }

    if (enableDebugPrint) {
      VitePressSidebar.debugPrint(optionItems, sidebarResult);
    }

    return sidebarResult;
  }

  private static generateNotTogetherMessage(options: string[]): string {
    return `These options cannot be used together: ${options.join(', ')}`;
  }

  private static generateSidebarItem(
    depth: number,
    currentDir: string,
    displayDir: string,
    parentName: string | null,
    options: VitePressSidebarOptions
  ): SidebarListItem {
    const filesByGlobPattern: string[] = fg.globSync('**', {
      cwd: currentDir,
      deep: 1,
      ignore: options.excludePattern || [],
      dot: true,
      onlyFiles: false
    });
    let directoryFiles: string[] = readdirSync(currentDir);

    if (options.manualSortFileNameByPriority!.length > 0) {
      const needSortItem = directoryFiles.filter(
        (x) => options.manualSortFileNameByPriority?.indexOf(x) !== -1
      );
      const remainItem = directoryFiles.filter(
        (x) => options.manualSortFileNameByPriority?.indexOf(x) === -1
      );

      needSortItem.sort(
        (a, b) =>
          options.manualSortFileNameByPriority!.indexOf(a) -
          options.manualSortFileNameByPriority!.indexOf(b)
      );

      directoryFiles = [...needSortItem, ...remainItem];
    }

    let sidebarItems: SidebarListItem = directoryFiles
      .map((x: string) => {
        const childItemPath = resolve(currentDir, x);
        let childItemPathDisplay = `${displayDir}/${x}`
          .replace(/\/{2}/, '/')
          .replace(/(index)?\.md$/, '');

        if (options.documentRootPath && childItemPathDisplay.startsWith(options.documentRootPath)) {
          childItemPathDisplay = childItemPathDisplay.replace(
            new RegExp(`^${options.documentRootPath}`, 'g'),
            ''
          );

          if (options.scanStartPath || options.resolvePath) {
            childItemPathDisplay = childItemPathDisplay.replace(/^\//g, '');

            if (options.scanStartPath) {
              childItemPathDisplay = childItemPathDisplay.replace(
                new RegExp(`^${options.scanStartPath}`, 'g'),
                ''
              );
            }

            childItemPathDisplay = childItemPathDisplay.replace(/^\/(?!$)/g, '');

            if (childItemPathDisplay === '/') {
              childItemPathDisplay = 'index.md';
            }
          } else if (!childItemPathDisplay.startsWith('/')) {
            childItemPathDisplay = `/${childItemPathDisplay}`;
          }
        }

        if (/\.vitepress/.test(childItemPath)) {
          return null;
        }

        if (/node_modules/.test(childItemPath)) {
          return null;
        }

        if (depth === 1 && x === 'index.md' && !options.includeRootIndexFile) {
          return null;
        }

        if (depth !== 1 && x === 'index.md' && !options.includeFolderIndexFile) {
          return null;
        }

        if (!options.includeDotFiles && /^\./.test(x)) {
          return null;
        }

        if (!filesByGlobPattern.includes(x)) {
          return null;
        }

        if (statSync(childItemPath).isDirectory()) {
          if (options.excludeFolders?.includes(x)) {
            return null;
          }

          let directorySidebarItems =
            VitePressSidebar.generateSidebarItem(
              depth + 1,
              childItemPath,
              childItemPathDisplay,
              x,
              options
            ) || [];

          let isTitleReceivedFromFileContent = false;
          let newDirectoryText = VitePressSidebar.getTitleFromMd(
            x,
            childItemPath,
            options,
            true,
            () => {
              isTitleReceivedFromFileContent = true;
            }
          );
          let newDirectoryPagePath = childItemPath;
          let withDirectoryLink;
          let isNotEmptyDirectory = false;

          const indexFilePath = `${childItemPath}/index.md`;
          const findSameNameSubFile = directorySidebarItems.find(
            (y: SidebarListItem) => y.text === x
          );

          if (
            (options.useFolderLinkFromSameNameSubFile ||
              options.convertSameNameSubFileToGroupIndexPage) &&
            findSameNameSubFile
          ) {
            newDirectoryPagePath = resolve(childItemPath, `${findSameNameSubFile.text}.md`);
            newDirectoryText = VitePressSidebar.getTitleFromMd(
              x,
              newDirectoryPagePath,
              options,
              false,
              () => {
                isTitleReceivedFromFileContent = true;
              }
            );

            if (options.folderLinkNotIncludesFileName) {
              withDirectoryLink = `${childItemPathDisplay}/`;
            } else {
              withDirectoryLink = findSameNameSubFile.link;
            }

            directorySidebarItems = directorySidebarItems.filter(
              (y: SidebarListItem) => y.text !== x
            );
          }

          // If an index.md file exists in a folder subfile,
          // replace the name or link of the folder with what is set in index.md.
          // The index.md file can still be displayed if the value of `includeFolderIndexFile` is `true`.
          if (existsSync(indexFilePath)) {
            if (options.includeFolderIndexFile) {
              isNotEmptyDirectory = true;
            }

            if (options.useFolderLinkFromIndexFile) {
              isNotEmptyDirectory = true;
              newDirectoryPagePath = indexFilePath;
              withDirectoryLink = `${childItemPathDisplay}/index.md`;
            }

            if (options.useFolderTitleFromIndexFile && !isTitleReceivedFromFileContent) {
              isNotEmptyDirectory = true;
              newDirectoryPagePath = indexFilePath;
              newDirectoryText = VitePressSidebar.getTitleFromMd(
                'index',
                newDirectoryPagePath,
                options,
                false
              );
            }
          }

          if (
            (withDirectoryLink && options.includeEmptyFolder !== false) ||
            options.includeEmptyFolder ||
            directorySidebarItems.length > 0 ||
            isNotEmptyDirectory
          ) {
            return {
              text: newDirectoryText,
              ...(withDirectoryLink ? { link: withDirectoryLink } : {}),
              ...(directorySidebarItems.length > 0 ? { items: directorySidebarItems } : {}),
              ...(options.collapsed === null ||
                options.collapsed === undefined ||
                directorySidebarItems.length < 1
                ? {}
                : { collapsed: depth >= options.collapseDepth! && options.collapsed }),
              ...(options.sortMenusByFrontmatterOrder
                ? {
                  order: VitePressSidebar.getOrderFromFrontmatter(
                    newDirectoryPagePath,
                    options.frontmatterOrderDefaultValue!
                  )
                }
                : {}),
              ...(options.sortMenusByFrontmatterDate
                ? {
                  date: VitePressSidebar.getDateFromFrontmatter(childItemPath)
                }
                : {})
            };
          }

          return null;
        }

        if (childItemPath.endsWith('.md')) {
          if (
            options.excludeFiles?.includes(x) ||
            VitePressSidebar.getExcludeFromFrontmatter(
              childItemPath,
              options.excludeFilesByFrontmatterFieldNames
            )
          ) {
            return null;
          }

          let childItemText;
          const childItemTextWithoutExt = x.replace(/\.md$/, '');

          if (
            (options.useFolderLinkFromSameNameSubFile ||
              options.convertSameNameSubFileToGroupIndexPage) &&
            parentName === childItemTextWithoutExt
          ) {
            childItemText = childItemTextWithoutExt;
          } else {
            childItemText = VitePressSidebar.getTitleFromMd(x, childItemPath, options, false);
          }

          return {
            text: childItemText,
            link: childItemPathDisplay,
            ...(options.sortMenusByFrontmatterOrder
              ? {
                order: VitePressSidebar.getOrderFromFrontmatter(
                  childItemPath,
                  options.frontmatterOrderDefaultValue!
                )
              }
              : {}),
            ...(options.sortMenusByFrontmatterDate
              ? {
                date: VitePressSidebar.getDateFromFrontmatter(childItemPath)
              }
              : {})
          };
        }
        return null;
      })
      .filter((x) => x !== null);


    if (options.sortMenusByName) {
      sidebarItems = VitePressSidebar.sortByObjectKey({
        arr: sidebarItems,
        key: 'text',
        desc: options.sortMenusOrderByDescending
      });
    }


    if (options.sortMenusByFileDatePrefix) {
      sidebarItems = VitePressSidebar.sortByObjectKey({
        arr: sidebarItems,
        key: 'text',
        desc: options.sortMenusOrderByDescending,
        dateSortFromTextWithPrefix: true,
        datePrefixSeparator: options.prefixSeparator
      });
    }

    if (options.sortMenusByFrontmatterOrder) {
      sidebarItems = VitePressSidebar.sortByObjectKey({
        arr: sidebarItems,
        key: 'order',
        desc: options.sortMenusOrderByDescending,
        numerically: true
      });

      VitePressSidebar.deepDeleteKey(sidebarItems, 'order');
    }

    if (options.sortMenusByFrontmatterDate) {
      sidebarItems = VitePressSidebar.sortByObjectKey({
        arr: sidebarItems,
        key: 'date',
        desc: options.sortMenusOrderByDescending,
        dateSortFromFrontmatter: true
      });

      VitePressSidebar.deepDeleteKey(sidebarItems, 'date');
    }

    if (options.sortMenusOrderNumericallyFromTitle) {
      sidebarItems = VitePressSidebar.sortByObjectKey({
        arr: sidebarItems,
        key: 'text',
        desc: options.sortMenusOrderByDescending,
        numerically: true
      });
    }

    if (options.sortMenusOrderNumericallyFromLink) {
      sidebarItems = VitePressSidebar.sortByObjectKey({
        arr: sidebarItems,
        key: 'link',
        desc: options.sortMenusOrderByDescending,
        numerically: true
      });
    }

    if (options.sortFolderTo) {
      sidebarItems = VitePressSidebar.sortByFileTypes(sidebarItems, options.sortFolderTo);
    }

    return sidebarItems;
  }

  // Get a single value of type T from Frontmatter
  // Defaults to defaultValue
  private static getValueFromFrontmatter<T>(filePath: string, key: string, defaultValue: T): T {
    try {
      const fileData = readFileSync(filePath, 'utf-8');
      const { data } = matter(fileData);

      // Try for using gray-matter
      if (data?.[key]) {
        return data[key];
      }

      // Try manual parsing
      const lines = fileData.split('\n');
      let frontmatterStart = false;

      for (let i = 0, len = lines.length; i < len; i += 1) {
        const str = lines[i].toString().replace('\r', '');

        if (/^---$/.test(str)) {
          frontmatterStart = true;
        }
        if (new RegExp(`^${key}: (.*)`).test(str) && frontmatterStart) {
          return JSON.parse(str.replace(`${key}: `, '')) as T;
        }
      }
    } catch (e) {
      return defaultValue;
    }
    return defaultValue;
  }

  private static getOrderFromFrontmatter(filePath: string, defaultOrder: number): number {
    return parseInt(
      VitePressSidebar.getValueFromFrontmatter<string>(filePath, 'order', defaultOrder.toString()),
      10
    );
  }

  private static getDateFromFrontmatter(filePath: string): string {
    return VitePressSidebar.getValueFromFrontmatter<string>(filePath, 'date', '0001-01-01');
  }

  private static getExcludeFromFrontmatter(
    filePath: string,
    excludeFrontmatterFieldName?: string[]
  ): boolean {
    if (!excludeFrontmatterFieldName) {
      return false;
    }

    const val = excludeFrontmatterFieldName.some(name => !!VitePressSidebar.getValueFromFrontmatter<boolean>(
      filePath,
      name,
      false
    ));
    console.log('getExcludeFromFrontmatter',filePath, val)
    return val;

    // return excludeFrontmatterFieldName.every(name => !!VitePressSidebar.getValueFromFrontmatter<boolean>(
    //   filePath,
    //   name,
    //   false
    // ));
  }

  private static capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  private static formatTitle(
    options: VitePressSidebarOptions,
    title: string,
    fromTitleHeading = false
  ): string {
    const htmlTags: string[] = [];
    const h1Headers: string[] = [];
    const htmlPlaceholder = '\u0001';
    const h1Placeholder = '\u0002';
    let text = title;

    // Replace HTML tags and Markdown h1 headers with placeholders
    text = text.replace(/<[^>]*>/g, (match) => {
      htmlTags.push(match);
      return htmlPlaceholder;
    });
    text = text.replace(/^(#+.*)$/gm, (match) => {
      h1Headers.push(match);
      return h1Placeholder;
    });

    // Remove certain Markdown format
    if (fromTitleHeading && !options.keepMarkdownSyntaxFromTitle) {
      text = text.replace(/\*{1,2}([^*]+?)\*{1,2}/g, '$1');
      text = text.replace(/_{1,2}([^_]+?)_{1,2}/g, '$1');
      text = text.replace(/~{1,2}([^~]+?)~{1,2}/g, '$1');
      text = text.replace(/`{1,3}([^`]+?)`{1,3}/g, '$1');
    }

    // Replace text [START]
    if (options.hyphenToSpace) {
      text = text.replace(/-/g, ' ');
    }
    if (options.underscoreToSpace) {
      text = text.replace(/_/g, ' ');
    }
    if (options.capitalizeEachWords) {
      let lastChar = '';

      for (let i = 0; i < text.length; i += 1) {
        if ((i === 0 || !/[a-zA-Z0-9]/.test(lastChar)) && /[a-z]/.test(text[i])) {
          text = text.slice(0, i) + text[i].toUpperCase() + text.slice(i + 1);
        }

        lastChar = text[i];
      }
    } else if (options.capitalizeFirst) {
      text = VitePressSidebar.capitalizeFirst(text);
    }
    // Replace text [END]

    // Restore Markdown headers and HTML tags
    let h1Index = -1;
    let htmlIndex = -1;
    text = text.replace(new RegExp(h1Placeholder, 'g'), () => {
      h1Index += 1;
      return h1Headers[h1Index];
    });
    text = text.replace(new RegExp(htmlPlaceholder, 'g'), () => {
      htmlIndex += 1;
      return htmlTags[htmlIndex];
    });

    return text;
  }

  private static getTitleFromMd(
    fileName: string,
    filePath: string,
    options: VitePressSidebarOptions,
    isDirectory: boolean,
    callbackTitleReceived?: () => void
  ): string {
    if (isDirectory) {
      return VitePressSidebar.formatTitle(options, fileName);
    }

    if (options.useTitleFromFrontmatter) {
      // Use content frontmatter title value instead of file name
      let value = VitePressSidebar.getValueFromFrontmatter<string | undefined>(
        filePath,
        options.frontmatterTitleFieldName || 'title',
        undefined
      );
      // Try to use title front-matter as fallback
      if (!value) {
        value = VitePressSidebar.getValueFromFrontmatter<string | undefined>(
          filePath,
          'title',
          undefined
        );
      }
      if (value) {
        callbackTitleReceived?.();
        return VitePressSidebar.formatTitle(options, value);
      }
    }

    if (options.useTitleFromFileHeading) {
      // Use content 'h1' string instead of file name
      try {
        const data = readFileSync(filePath, 'utf-8');
        const lines = data.split('\n');

        for (let i = 0, len = lines.length; i < len; i += 1) {
          let str = lines[i].toString().replace('\r', '');

          if (/^# /.test(str)) {
            str = str.replace(/^# /, '');

            if (/\[(.*)]\(.*\)/.test(str)) {
              // Remove hyperlink from h1 if exists
              const execValue = /(.*)?\[(.*)]\((.*)\)(.*)?/.exec(str) || '';

              str =
                execValue.length > 0
                  ? `${execValue[1] || ''}${execValue[2] || ''}${execValue[4] || ''}`
                  : '';
            }

            callbackTitleReceived?.();
            return VitePressSidebar.formatTitle(options, str, true);
          }
        }
      } catch {
        return 'Unknown';
      }
    }

    return VitePressSidebar.formatTitle(options, fileName.replace(/\.md$/, ''));
  }

  private static sortByFileTypes(
    arrItems: SidebarListItem,
    sortFolderTo: 'top' | 'bottom'
  ): object[] {
    for (let i = 0; i < arrItems.length; i += 1) {
      if (arrItems[i].items && arrItems[i].items.length) {
        arrItems[i].items = VitePressSidebar.sortByFileTypes(arrItems[i].items, sortFolderTo);
      }
    }

    const itemFolders = arrItems.filter((item: SidebarItem) => Object.hasOwn(item, 'items'));
    const itemFiles = arrItems.filter((item: SidebarItem) => !Object.hasOwn(item, 'items'));

    if (sortFolderTo === 'top') {
      return [...itemFolders, ...itemFiles];
    }

    return [...itemFiles, ...itemFolders];
  }

  private static sortByObjectKey(options: SortByObjectKeyOptions): object[] {
    for (let i = 0; i < options.arr.length; i += 1) {
      if (options.arr[i].items && options.arr[i].items.length) {
        options.arr[i].items = VitePressSidebar.sortByObjectKey({
          ...options,
          arr: options.arr[i].items
        });
      }
    }

    const basicCollator = new Intl.Collator([], {
      numeric: options.numerically,
      sensitivity: 'base'
    });
    let result;

    if (options.dateSortFromFrontmatter) {
      result = options.arr.sort(
        (a: SidebarListItem, b: SidebarListItem) =>
          new Date(a[options.key]).valueOf() - new Date(b[options.key]).valueOf()
      );

      if (options.desc) {
        result = result.reverse();
      }
    } else if (options.dateSortFromTextWithPrefix) {
      const dateRegex = /^[0-9]{4}-[0-9]{2}-[0-9]{2}/g;

      result = options.arr.sort((a: SidebarListItem, b: SidebarListItem) => {
        const aDate = a[options.key].split(dateRegex)?.[0];
        const bDate = b[options.key].split(dateRegex)?.[0];

        return new Date(aDate).valueOf() - new Date(bDate).valueOf();
      });

      if (options.desc) {
        result = result.reverse();
      }
    } else {
      result = options.arr.sort((a: SidebarListItem, b: SidebarListItem) => {
        const compareResult = basicCollator.compare(a[options.key], b[options.key]);

        return options.desc ? -compareResult : compareResult;
      });
    }

    return result;
  }

  private static deepDeleteKey(obj: SidebarListItem, key: string): void {
    if (typeof obj !== 'object' || obj === null) {
      return;
    }

    if (Object.hasOwn(obj, key)) {
      delete obj[key];
    }

    Object.keys(obj).forEach((item) => {
      if (typeof obj[item] === 'object') {
        VitePressSidebar.deepDeleteKey(obj[item], key);
      }
    });
  }

  private static removePrefixFromTitleAndLink(
    sidebarList: SidebarListItem,
    options: VitePressSidebarOptions
  ): SidebarListItem {
    const sidebarListLength = sidebarList.length;

    for (let i = 0; i < sidebarListLength; i += 1) {
      const obj = sidebarList[i];

      for (let j = 0; j < Object.keys(obj).length; j += 1) {
        const key = Object.keys(obj)[j];

        if (key === 'text') {
          if (
            !(
              !(options.prefixSeparator instanceof RegExp) &&
              obj[key].indexOf(options.prefixSeparator) === -1
            )
          ) {
            const splitItem = obj[key].split(options.prefixSeparator);

            splitItem.shift();

            obj[key] = splitItem.join(options.prefixSeparator);
          }
        } else if (key === 'items') {
          obj[key] = VitePressSidebar.removePrefixFromTitleAndLink(obj[key], options);
        }
      }
    }

    return sidebarList;
  }

  private static isTrueMinimumNumberOfTimes(conditions: any[], minimumCount = 1): boolean {
    const conditionLength = conditions.length;
    let trueCount = 0;

    for (let i = 0; i < conditionLength; i += 1) {
      if (typeof conditions[i] === 'boolean' && conditions[i]) {
        trueCount += 1;
      }
    }

    return trueCount >= minimumCount;
  }

  private static isObject(data: any): boolean {
    return data !== null && data !== undefined && Object.getPrototypeOf(data) === Object.prototype;
  }

  private static objMergeNewKey(obj: AnyValueObject, obj2: AnyValueObject): AnyValueObject | null {
    if (!obj || typeof obj !== 'object' || !obj2 || typeof obj2 !== 'object') {
      return null;
    }

    const merged: AnyValueObject = { ...obj };

    Object.keys(obj2).forEach((key: string) => {
      const data = obj2[key];

      if (Object.hasOwn(merged, key)) {
        if (Array.isArray(merged[key]) && Array.isArray(data)) {
          if (merged[key].length === data.length) {
            for (let i = 0; i < merged[key].length; i += 1) {
              const update = data[i];

              if (VitePressSidebar.isObject(update)) {
                merged[key][i] = VitePressSidebar.objMergeNewKey(merged[key][i], update);
              }
            }
          }
        } else if (VitePressSidebar.isObject(merged[key]) && VitePressSidebar.isObject(data)) {
          merged[key] = VitePressSidebar.objMergeNewKey(merged[key], data);
        } else {
          merged[key] = data;
        }
      } else {
        merged[key] = data;
      }
    });

    return merged;
  }

  static debugPrint(optionItems?: AnyValueObject, sidebarResult?: AnyValueObject): void {
    process.stdout.write(
      `\n${'='.repeat(50)}\n${JSON.stringify(optionItems, null, 2)}\n${'-'.repeat(
        50
      )}\n${JSON.stringify(sidebarResult, null, 2)}\n${'='.repeat(50)}\n\n`
    );
  }
}

export { VitePressSidebar };

export const { withSidebar, generateSidebar } = VitePressSidebar;
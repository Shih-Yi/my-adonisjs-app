import Page from '#models/page'

export default class PagePolicy {
  // 檢查是否可以修改頁面類型
  canChangeType(page: Page) {
    return !page.isFirstLevel && !page.hasChildren
  }

  // 檢查是否可以修改父頁面
  canChangeParent(page: Page) {
    return !page.isFirstLevel && !page.hasChildren
  }

  // 檢查是否可以刪除頁面
  canDelete(page: Page) {
    return !page.isFirstLevel && !page.hasChildren
  }

  // 檢查父頁面是否合法
  isValidParent(parentPage: Page) {
    return parentPage.isFirstLevel || parentPage.parent?.isFirstLevel
  }

  isMatchingType(page: Page, parentPage: Page) {
    // 檢查類型
    return page.type === parentPage.type
  }
}
